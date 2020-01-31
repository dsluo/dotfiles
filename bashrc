#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

# prompt
PS1='[\u@\h \W]\$ '

# bash completion
[[ $PS1 && -f /usr/share/bash-completion ]] && \
	. /usr/share/bash-completion

# aliases
alias ls='ls --color=auto'
alias ll="ls -ahl"
alias la="ls -a"

# environment
export PATH="$HOME/.cargo/bin:$PATH"
export PATH=$PATH:$HOME/.local/bin

