import {
	DynamicBorder,
	getMarkdownTheme,
	type ExtensionAPI,
	type ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { Container, Markdown, matchesKey, Text } from "@earendil-works/pi-tui";

const SUBCOMMANDS = ["tools", "system-prompt"] as const;

async function showReadonlyMarkdown(title: string, content: string, ctx: ExtensionCommandContext) {
	if (ctx.mode !== "tui") {
		console.log(content);
		return;
	}

	await ctx.ui.custom((_tui, theme, _keybindings, done) => {
		const container = new Container();
		const border = new DynamicBorder((text: string) => theme.fg("accent", text));

		container.addChild(border);
		container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));
		container.addChild(new Markdown(content, 1, 1, getMarkdownTheme()));
		container.addChild(new Text(theme.fg("dim", "Read-only · press Enter or Esc to close"), 1, 0));
		container.addChild(border);

		return {
			render: (width: number) => container.render(width),
			invalidate: () => container.invalidate(),
			handleInput: (data: string) => {
				if (matchesKey(data, "enter") || matchesKey(data, "escape")) done(undefined);
			},
		};
	});
}

export default function doctorExtension(pi: ExtensionAPI) {
	pi.registerCommand("doctor", {
		description: "Inspect Pi's active tools or effective system prompt",
		getArgumentCompletions: (prefix) => {
			const matches = SUBCOMMANDS
				.filter((command) => command.startsWith(prefix.trim()))
				.map((command) => ({ value: command, label: command }));
			return matches.length > 0 ? matches : null;
		},
		handler: async (args, ctx) => {
			const subcommand = args.trim();

			if (subcommand === "tools") {
				const activeTools = new Set(pi.getActiveTools());
				const allTools = pi.getAllTools().toSorted((left, right) => left.name.localeCompare(right.name));
				const activeCount = allTools.filter((tool) => activeTools.has(tool.name)).length;
				const report = [
					`# Pi tools`,
					"",
					`**${activeCount}/${allTools.length} tools active**`,
					"",
					...allTools.map((tool) =>
						`- ${activeTools.has(tool.name) ? "**active**" : "inactive"} — \`${tool.name}\``,
					),
				].join("\n");
				await showReadonlyMarkdown("Pi tool diagnostics", report, ctx);
				return;
			}

			if (subcommand === "system-prompt") {
				await showReadonlyMarkdown("Pi system prompt", ctx.getSystemPrompt(), ctx);
				return;
			}

			ctx.ui.notify("Usage: /doctor tools | /doctor system-prompt", "error");
		},
	});
}
