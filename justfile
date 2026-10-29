_:
    @just --list

# Update mise packages and unsupported Brewfile casks
update:
    mise self-update -y
    mise bootstrap packages apply --manager brew -y
    mise bootstrap packages apply --manager brew-cask -y
    brew bundle -g
    PATH="/opt/homebrew/bin:$PATH" mise bootstrap packages apply --manager mas -y
    mise bootstrap packages upgrade -y
    mise upgrade -y

# Pull changes from dotfiles to chezmoi
pull:
    git config --local include.path ../git-filters.conf
    chezmoi re-add

# Push changes from chezmoi to dotfiles
push:
    chezmoi apply

# chezmoi diff
diff:
    chezmoi diff
