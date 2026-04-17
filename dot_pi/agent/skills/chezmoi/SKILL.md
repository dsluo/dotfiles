---
name: chezmoi
description: Manage dotfiles and configuration across multiple machines using chezmoi. Use for initializing chezmoi, adding/editing dotfiles, managing machine-specific configs, templating, secrets/password managers, scripts, and daily dotfile workflows.
license: MIT
---

# Chezmoi Skill

Manage dotfiles across multiple machines securely using [chezmoi](https://www.chezmoi.io/).

## Core Concepts

- **Source state**: A git repository (`~/.local/share/chezmoi` by default) containing the desired state of all dotfiles
- **Target state**: The actual dotfiles on your filesystem (e.g., `~/.bashrc`, `~/.config/nvim/init.lua`)
- **chezmoi applies the source state to the target state** when you run `chezmoi apply`
- Files in the source directory use a special naming convention: `dot_<filename>` maps to `~/<filename>`, `config_<path>` maps to `~/.config/<path>`, etc.

### Source Directory Naming Conventions

| Source file | Target |
|---|---|
| `dot_bashrc` | `~/.bashrc` |
| `dot_config/nvim/init.lua` | `~/.config/nvim/init.lua` |
| `dot_local/bin/myscript.sh` | `~/.local/bin/myscript.sh` |
| `bin/git-credential-manager.sh` | `~/.local/bin/git-credential-manager.sh` (executable, not a dotfile) |
| `scripts/pre-merge/01-setup.sh` | Runs as a script before merge |

### Source State Attributes

Append attributes to filenames in the source directory:

| Suffix | Meaning |
|---|---|
| `.encrypted` | Encrypted file (age/gpg/rage) |
| `.tmpl` | Template file (Go templates) |
| `.sym` | Symbolic link |
| `.copy` | Copy file (don't diff) |
| `.attr` | Set file attributes |
| `.external` | External source (git submodule) |

## Setup

### Initial Setup on a New Machine

```bash
# 1. Install chezmoi (if not already installed)
brew install chezmoi  # macOS
# or follow: https://www.chezmoi.io/install/

# 2. Initialize chezmoi from your remote repo
chezmoi init <remote-repo-url>

# 3. Apply all dotfiles
chezmoi apply

# 4. Verify everything looks good
chezmoi status
chezmoi doctor
```

### Initialize a New chezmoi Repository

```bash
# Create a new source directory
chezmoi init

# Add your remote
cd "$(chezmoi source-path)"
git remote add origin <your-repo-url>
git push -u origin main

# Add your first files
chezmoi add ~/.bashrc
```

## Daily Operations

### Adding Files

```bash
# Add a single file
chezmoi add ~/.bashrc

# Add a directory
chezmoi add ~/.config/nvim

# Add interactively (prompts for each file)
chezmoi add --interactive ~/.config

# Add a file with a different target name
chezmoi add --dest=~/.zshrc ~/.bashrc
```

### Editing Files

```bash
# Edit a file through chezmoi (opens in your $EDITOR, handles encryption/templates)
chezmoi edit ~/.bashrc
# or equivalently:
chezmoi edit dot_bashrc

# Edit the chezmoi config file
chezmoi edit-config

# Edit an encrypted file
chezmoi edit-encrypted ~/.config/app/secrets.json

# Open the source directory in your editor
chezmoi cd
```

### Viewing Changes

```bash
# See what chezmoi would change (dry-run diff)
chezmoi diff

# See current status
chezmoi status

# List managed files
chezmoi managed

# List unmanaged files
chezmoi unmanaged

# List ignored files
chezmoi ignored

# Show the source path for a target file
chezmoi source-path ~/.bashrc

# Show the target path for a source file
chezmoi target-path dot_bashrc
```

### Applying Changes

```bash
# Apply all changes
chezmoi apply

# Apply only specific files
chezmoi apply ~/.bashrc ~/.config/nvim/init.lua

# Apply in verbose mode
chezmoi apply -v

# Apply in dry-run mode (no changes)
chezmoi apply --dry-run

# Force apply (overwrite even if target differs)
chezmoi apply --force
```

### Removing Files

```bash
# Remove from target and source state
chezmoi rm ~/.bashrc

# Remove only from target (keep in source state)
chezmoi rm --dest ~/.bashrc

# Unmanage a file (keep on disk, remove from chezmoi)
chezmoi unmanage ~/.bashrc
```

## Machine-Specific Configurations

Use `.chezmoi.local.yaml` for machine-specific settings (never committed to git):

```yaml
# .chezmoi.local.yaml
mymachine:
  git:
    user:
      name: My Name
      email: my@machine.com
```

Or use templates with conditionals:

```yaml
# dot_gitconfig.tmpl
[user]
    name = {{ .chezmoi.username }}
    email = {{ .chezmoi.email }}
{{- if eq .chezmoi.os "darwin" }}
    signingkey = {{ .chezmoi.gpg_key }}
{{- end }}
```

### Machine Naming

chezmoi identifies machines using the `machines` section in the config:

```bash
# Set machine name
chezmoi edit-config
# Add:
# machines:
#   - name: macbook
#   - name: work-laptop
```

## Templating

chezmoi uses Go templates. Template files end with `.tmpl`.

### Common Template Variables

```
{{ .chezmoi.hostname }}    # Current machine hostname
{{ .chezmoi.os }}          # Operating system (darwin, linux, windows)
{{ .chezmoi.arch }}        # Architecture (amd64, arm64)
{{ .chezmoi.homeDir }}     # Home directory
{{ .chezmoi.username }}    # Username
{{ .chezmoi.version }}     # chezmoi version
```

### Template Functions

```go-template
{{ "secret" | secret }}                    # Encrypt a secret
{{ .secret | decrypt }}                    # Decrypt a secret
{{ .var | default "fallback" }}            # Default value
{{ if eq .chezmoi.os "darwin" }}...{{ end }}  # Conditionals
{{ range .items }}...{{ end }}             # Loops
{{ .data.key | toYaml }}                   # Convert to YAML
{{ output "command" }}                     # Run command and capture output
```

### External Data Files

Store data in `.chezmoidata.json` or `.chezmoidata.yaml`:

```json
// .chezmoidata.json
{
  "username": "myuser",
  "email": "me@example.com",
  "ssh_keys": ["id_ed25519"]
}
```

### External Sources

Define external sources in `.chezmoiexternal.yaml`:

```yaml
https://github.com/junegunn/fzf.git:
  type: git-archive
  url: https://github.com/junegunn/fzf/archive/master.tar.gz
  exact: true
  target: .fzf
  stripComponents: 1
```

## Secrets & Password Managers

### Encrypted Files

```bash
# Encrypt a file with age (default)
chezmoi encrypt ~/.config/app/secrets.json
# Creates: dot_config/app/secrets.json.encrypted

# Decrypt
chezmoi decrypt dot_config/app/secrets.json.encrypted

# Edit encrypted file directly
chezmoi edit-encrypted dot_config/app/secrets.json.encrypted
```

### Password Manager Integration

chezmoi supports 1Password, Bitwarden, pass, gopass, KeePassXC, and more:

```go-template
# In a template file:
[github]
    user = {{ (onepassword "Private" "GitHub").username }}
    token = {{ (onepassword "Private" "GitHub").password }}

# Or with pass:
    token = {{ pass "github/token" }}

# Or with bitwarden:
    token = {{ bitwarden "github" "token" }}
```

### Secret Files

Store secrets in `.secrets` files and reference them:

```
# .secrets
github_token=ghp_xxxxxxxxxxxx
```

```go-template
# In dot_gitconfig.tmpl:
[credential]
    helper = store
    helper = !gh auth git-credential
```

## Scripts

Scripts in `.chezmoiscripts/` run at specific lifecycle points:

```
.chezmoiscripts/
├── pre-apply/
│   └── 01-setup.sh          # Runs before chezmoi apply
├── post-apply/
│   └── 01-setup.sh          # Runs after chezmoi apply
└── pre-merge/
    └── 01-setup.sh          # Runs before merge
```

```bash
# Add a script
mkdir -p "$(chezmoi source-path)/.chezmoiscripts/post-apply"
echo '#!/bin/sh
brew bundle --file ~/.Brewfile' > "$(chezmoi source-path)/.chezmoiscripts/post-apply/01-brew.sh"
chezmoi add .chezmoiscripts
```

## Common Workflows

### Migrating Existing Dotfiles

```bash
# 1. Start tracking existing files
chezmoi init <repo-url>
chezmoi add ~/.bashrc
chezmoi add ~/.config/nvim
chezmoi add ~/.gitconfig

# 2. For machine-specific files, use templates
chezmoi edit-config

# 3. Commit and push
cd "$(chezmoi source-path)"
git add .
git commit -m "Initial dotfiles"
git push
```

### Updating chezmoi

```bash
chezmoi self-update
```

### Archiving

```bash
# Create an archive of all managed files
chezmoi archive > dotfiles.tar.gz
```

### Troubleshooting

```bash
# Check for issues
chezmoi doctor

# See what's out of sync
chezmoi diff

# Force re-apply everything
chezmoi apply --force

# Remove and re-apply a specific file
chezmoi rm ~/.bashrc
chezmoi apply ~/.bashrc

# Check if a file is managed
chezmoi managed | grep bashrc

# Reset target file to source state
chezmoi apply ~/.bashrc
```

## Key Commands Quick Reference

| Command | Purpose |
|---|---|
| `chezmoi init <url>` | Initialize from remote repo |
| `chezmoi apply` | Apply source state to target |
| `chezmoi add <path>` | Add file/dir to source state |
| `chezmoi edit <path>` | Edit file through chezmoi |
| `chezmoi edit-config` | Edit chezmoi config |
| `chezmoi diff` | Show pending changes |
| `chezmoi status` | Show status |
| `chezmoi managed` | List managed files |
| `chezmoi unmanaged` | List unmanaged files |
| `chezmoi rm <path>` | Remove from target and source |
| `chezmoi source-path` | Print source directory path |
| `chezmoi cd` | Open source directory |
| `chezmoi doctor` | Diagnose issues |
| `chezmoi archive` | Create archive of dotfiles |
| `chezmoi update` | Update from remote repo |
| `chezmoi data` | Show resolved data |

## Tips

- Always use `chezmoi diff` before `chezmoi apply` to review changes
- Use `chezmoi edit` instead of editing files directly — it handles encryption and templates
- Keep `.chezmoi.local.yaml` out of git for machine-specific secrets
- Use `.tmpl` files with templates for machine/OS-specific configurations
- Use `chezmoi source-path` to quickly navigate to the source directory
- The source directory is just a git repo — use `git log`, `git blame`, etc. normally
- Use `chezmoi add --interactive` to selectively add files with prompts
