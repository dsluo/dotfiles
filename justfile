_:
  @just --list

# Update all packages: brew, mise, mas
update:
  brew bundle -g
  brew upgrade -y
  mise self-update -y
  mise upgrade -y
  mas update

# Pull changes from dotfiles to chezmoi
pull:
  chezmoi re-add

# Push changes from chezmoi to dotfiles
push:
  chezmoi apply

# chezmoi diff
diff:
  chezmoi diff
