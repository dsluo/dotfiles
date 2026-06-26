if status is-interactive
    # Commands to run in interactive sessions can go here
    alias vim nvim
    alias lg lazygit
end
$HOME/.local/bin/mise activate fish | source
set -gx XDG_CONFIG_HOME $HOME/.config
