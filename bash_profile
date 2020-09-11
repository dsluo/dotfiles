#
# ~/.bash_profile
#

[[ -f $HOME/.bashrc ]] || ( [[ -h $HOME/.bashrc ]] && [[ -f $(readlink $HOME/.bashrc) ]] ) && . ~/.bashrc


export PATH="$HOME/.cargo/bin:$PATH"
