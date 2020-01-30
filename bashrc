#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

PS1='[\u@\h \W]\$ '

[[ $PS1 && -f /usr/share/bash-completion ]] && \
	. /usr/share/bash-completion

alias ls='ls --color=auto'
alias ll="ls -ahl"
alias la="ls -a"

export PATH="$HOME/.cargo/bin:$PATH"
export PATH=$PATH:$HOME/.local/bin

