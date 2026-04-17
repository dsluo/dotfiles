/**
 * Permission Gate Extension
 *
 * Prompts for confirmation before running bash commands,
 * except for common read-only commands.
 *
 * The prompt is a Yes/No SelectList with an attached feedback Input.
 * Tab toggles focus between the choice list and the feedback field,
 * so the user can send a free-form message to the LLM along with the
 * allow/deny decision (e.g. "Yes, but also …" or "No, do X instead").
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import {
	Container,
	Input,
	matchesKey,
	type SelectItem,
	SelectList,
	Text,
} from "@mariozechner/pi-tui";

// Read-only commands that don't need confirmation
const READ_ONLY_COMMANDS = [
	// File inspection
	"cat ", "head ", "tail ", "less ", "more ", "grep ", "rg ", "ripgrep ",
	"wc ", "sort ", "uniq ", "diff ", "comm ",
	// Listing
	"ls ", "ls -", "ls\b", "tree ", "find ",
	// Git read-only
	"git log", "git diff", "git show", "git status", "git branch", "git tag",
	"git blame", "git describe", "git rev-parse", "git shortlog",
	"git stash list", "git reflog", "git for-each-ref",
	"git ls-files", "git ls-tree", "git name-rev",
	"git archive", "git cat-file -t", "git cat-file -p",
	// System info
	"uname ", "uptime ", "whoami ", "id ", "env", "printenv",
	"df ", "free ", "du ", "which ", "whereis ",
	// Process info
	"ps ", "top", "htop", "pgrep ", "pidof ",
	// File info (read-only)
	"stat ", "file ", "md5sum ", "sha256sum ",
	// Documentation
	"man ", "info ", "apropos ",
	// Pi built-in tools
	"pi --list-models", "pi --version", "pi --help",
];

function isReadOnlyCommand(command: string): boolean {
	return READ_ONLY_COMMANDS.some((pattern) => command.startsWith(pattern));
}

type PromptResult = { choice: "Yes" | "No"; feedback: string } | null;

async function promptWithFeedback(ctx: ExtensionContext, title: string): Promise<PromptResult> {
	return await ctx.ui.custom<PromptResult>((tui, theme, _kb, done) => {
		const items: SelectItem[] = [
			{ value: "Yes", label: "Yes" },
			{ value: "No", label: "No" },
		];

		const selectList = new SelectList(items, 2, {
			selectedPrefix: (t) => theme.fg("accent", t),
			selectedText: (t) => theme.fg("accent", t),
			description: (t) => theme.fg("muted", t),
			scrollInfo: (t) => theme.fg("dim", t),
			noMatch: (t) => theme.fg("warning", t),
		});

		const input = new Input();

		let focus: "select" | "input" = "select";

		const finish = (choice: "Yes" | "No") => {
			done({ choice, feedback: input.getValue().trim() });
		};

		selectList.onSelect = (item) => finish(item.value as "Yes" | "No");
		selectList.onCancel = () => done(null);

		input.onSubmit = () => {
			const item = selectList.getSelectedItem();
			finish((item?.value as "Yes" | "No") ?? "No");
		};
		input.onEscape = () => done(null);

		const hint = new Text("", 1, 0);
		const updateHint = () => {
			const msg =
				focus === "select"
					? "↑↓ choose • enter confirm • tab → feedback • esc cancel"
					: "type feedback • enter confirm • tab → choices • esc cancel";
			hint.setText(theme.fg("dim", msg));
		};
		updateHint();

		const inputLabel = new Text(theme.fg("muted", "Feedback (optional):"), 1, 0);

		const container = new Container();
		container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
		container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
		container.addChild(selectList);
		container.addChild(inputLabel);
		container.addChild(input);
		container.addChild(hint);
		container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

		return {
			render: (w) => container.render(w),
			invalidate: () => container.invalidate(),
			handleInput: (data) => {
				if (matchesKey(data, "tab") || matchesKey(data, "shift+tab")) {
					focus = focus === "select" ? "input" : "select";
					input.focused = focus === "input";
					updateHint();
					tui.requestRender();
					return;
				}
				if (focus === "select") {
					selectList.handleInput(data);
				} else {
					input.handleInput(data);
				}
				tui.requestRender();
			},
		};
	});
}

async function confirm(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	title: string,
	blockedLabel: string,
): Promise<{ block: true; reason: string } | undefined> {
	if (!ctx.hasUI) {
		return { block: true, reason: `${blockedLabel} (no UI for confirmation)` };
	}

	const result = await promptWithFeedback(ctx, title);
	if (!result) return { block: true, reason: "Blocked by user" };

	const { choice, feedback } = result;
	if (choice === "Yes") {
		if (feedback) {
			pi.sendUserMessage(feedback, { deliverAs: "steer" });
		}
		return undefined;
	}

	const reason = feedback
		? `Blocked by user. User feedback: ${feedback}`
		: "Blocked by user";
	return { block: true, reason };
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event, ctx) => {
		// --- Bash commands ---
		if (event.toolName === "bash") {
			const command = event.input.command as string;
			if (!command) return undefined;

			if (isReadOnlyCommand(command)) return undefined;

			return await confirm(pi, ctx, `🔒 Run bash command?\n  ${command}`, "Bash command blocked");
		}

		// --- Edit tool ---
		if (event.toolName === "edit") {
			const input = event.input as { path?: string };
			if (!input.path) return undefined;
			return await confirm(pi, ctx, `🔒 Edit file?\n  ${input.path}`, "Edit blocked");
		}

		// --- Write tool ---
		if (event.toolName === "write") {
			const input = event.input as { path?: string };
			if (!input.path) return undefined;
			return await confirm(pi, ctx, `🔒 Write file?\n  ${input.path}`, "Write blocked");
		}

		return undefined;
	});
}
