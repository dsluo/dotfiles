# CLAUDE.md

This repo is the **chezmoi source directory** (`~/.local/share/chezmoi`). It holds the managed
versions of dotfiles that chezmoi renders into `$HOME`. Editing files here does **not** change the
live dotfiles until `chezmoi apply` runs.

chezmoi documentation: https://www.chezmoi.io/

## How chezmoi maps files

chezmoi encodes destination path and file attributes into the **source filename**, not the contents.
Common prefixes/suffixes used in this repo:

- `dot_` → renders to a leading `.` (e.g. `dot_gitconfig` → `~/.gitconfig`, `dot_config/` → `~/.config/`)
- `private_` → destination file gets `0600` perms (e.g. `private_fish/` → `~/.config/fish/`)
- `.tmpl` → the file is a Go template rendered by chezmoi (e.g. `Work/dot_gitconfig.tmpl`)
- `.keep` → placeholder so an otherwise-empty directory is tracked

So `dot_config/private_fish/config.fish` lives at `~/.config/fish/config.fish`. When renaming or
adding files, follow these conventions rather than editing paths by hand — use `chezmoi add <path>`.

## Common tasks (justfile)

`just` (or `just _`) lists recipes. Note the push/pull naming is from the repo's point of view:

- `just pull` → `chezmoi re-add` — pull edits made to **live** dotfiles back into this source repo
- `just push` → `chezmoi apply` — push this source repo's state out to the live dotfiles
- `just update` → install and upgrade bootstrap packages, update mise, then upgrade mise tools

Typical loop: edit source files here → `just push` to apply, or edit live dotfiles → `just pull` to
capture. Always run `chezmoi diff` before applying if unsure.

## Package management

- **mise** — `dot_config/mise/config.toml`: dev/project runtimes and CLIs (node, python, go, rust, uv, github-cli, claude, etc.), plus system formulae, casks, and Mac App Store apps in `[bootstrap.packages]`. mise is activated in `config.fish`.

Use `mise bootstrap packages apply` to install missing system packages and `mise bootstrap packages upgrade` to update them. The Homebrew prefix remains `/opt/homebrew` on Apple Silicon, but mise manages formulae and most casks directly without the Homebrew executable. `dot_config/private_homebrew/Brewfile` retains `openshell`, `whatcable`, and `lprint`, whose taps do not publish the formula or cask API metadata mise requires.

## Templating & secrets

Templates use `.tmpl` and pull secrets from **1Password** via `onepasswordRead`, e.g.
`Work/dot_gitconfig.tmpl` reads `op://chezmoi/git-work/...`. Applying templates requires the
1Password CLI (`op`) to be signed in. Never hardcode secrets in source files — use a template.

## Git config layout

`dot_gitconfig` sets global identity (`me@dsluo.dev`) and conditionally includes per-directory
configs via `includeIf`:

- `~/Work/` → `Work/dot_gitconfig.tmpl` (work identity from 1Password)
- `~/Projects/` → `Projects/dot_gitconfig`

## Other files

- `.chezmoiignore` — paths chezmoi should not manage (e.g. `.pi/agent/` session/auth data, `mise.toml`).
- `mise.toml` (repo root) — pins tooling for *this repo's own* maintenance (node + `renovate`); ignored by chezmoi.
- `.renovaterc.json` — Renovate config; keeps npm deps in pi agent settings up to date.
- `.gitignore` — ignores `.DS_Store`.
