#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

# prompt
PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\] \$ '

# bash completion
[[ $PS1 && -f /usr/share/bash-completion ]] && \
	. /usr/share/bash-completion

# aliases
alias ls='ls --color=auto'
alias ll="ls -ahl"
alias la="ls -a"

# environment
export PATH="$HOME/.cargo/bin:$PATH"
export PATH="$PATH:$HOME/.local/bin"

export EDITOR=vim
export VISUAL=vim

if [ -x "$(command -v xclip)" ]
then
    alias cb="xclip -selection clipboard"
fi

if [ -f /usr/share/powerline/bindings/bash/powerline.sh ]
then
    powerline-daemon -q
    POWERLINE_BASH_CONTINUATION=1
    POWERLINE_BASH_SELECT=1
    . /usr/share/powerline/bindings/bash/powerline.sh
fi
