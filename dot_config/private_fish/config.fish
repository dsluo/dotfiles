/opt/homebrew/bin/brew shellenv fish | source

if status is-interactive
    # Commands to run in interactive sessions can go here
    alias vim nvim
    alias lg lazygit
    alias tf tofu
    alias tg terragrunt
    alias kubecolor kubectl
    alias k kubecolor
    alias oc opencode
    alias cc claude
end

$HOME/.local/bin/mise activate fish | source

set -gx XDG_CONFIG_HOME $HOME/.config
set -gx EDITOR nvim

# Added by LM Studio CLI (lms)
set -gx PATH $PATH /Users/dsluo/.lmstudio/bin
# End of LM Studio CLI section
