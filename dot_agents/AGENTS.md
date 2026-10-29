# Global instructions

## Ask before publishing work

Commit and push freely on feature branches - no need to ask. Never commit or
push directly to a default branch (`main`/`master`).

Ask for my explicit go-ahead before creating a pull request or opening an
issue. Prepare the work and show me what you'd submit — I want to review
before anything is made public.

Approval is per-action and does not carry forward: "yes, open that PR" is not
permission to open an issue, and permission on one task does not extend to the
next.

## Style

DO NOT USE emdashes (—) or "load-bearing"

When writing or explaining for someone outside the domain, don't assume they
know the jargon, but don't hide it either: keep the precise term and gloss it
in plain words on first use, by what it does here (e.g. "the 47.7 GiB n-gram
embedding, read with O_DIRECT, straight from disk and bypassing the kernel's
page cache"). Keep every number, name and flag. The `/dejargon` (rewrite text)
and `/explain-plainly` (explain things) skills cover this in detail.

## Where these instructions and skills live

This file is `~/.agents/AGENTS.md`, managed by my chezmoi dotfiles repo
(`~/.local/share/chezmoi`, source file `dot_agents/AGENTS.md`). `~/.claude/CLAUDE.md`,
`~/.codex/AGENTS.md`, `~/.pi/agent/AGENTS.md` and `~/.config/opencode/AGENTS.md` are
symlinks to it, so there is one copy for every agent.

Global skills live in `~/.agents/skills/<name>/` (source: `dot_agents/skills/`). Codex
and pi read that directory directly; Claude Code gets a symlink per skill in
`~/.claude/skills`, created by a chezmoi script on `chezmoi apply`.

To change global instructions or skills:

- Edit the source in the chezmoi repo, then run `chezmoi apply` (`just push`), or edit
  the live file and capture it with `chezmoi re-add` (`just pull`).
- Never replace a symlink with a regular file or write a separate copy per tool.
- To add a skill, create its directory under `dot_agents/skills/` and apply. Don't
  put new skills straight into `~/.claude/skills`.
- The dotfiles repo is public. Anything naming my employer, coworkers, ADO orgs or
  internal infrastructure must be added with `chezmoi add --encrypt` (age, key in
  1Password). See the repo's CLAUDE.md for details.
