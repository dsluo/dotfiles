#!/usr/bin/env bash

declare -A configs=(
    ["vimrc"]=".vimrc"
    ["ssh_config"]=".ssh/config"
    ["bashrc"]=".bashrc"
    ["bash_profile"]=".bash_profile"
    ["gitconfig"]=".gitconfig"
    ["powerline"]=".config/powerline"
)

for config in "${!configs[@]}"
do
    echo "Linking $config."
    if [ -d $PWD/$config ]
    then
        mkdir -p $(dirname $HOME/${configs[$config]})
    fi
    ln -s -i $PWD/$config $HOME/${configs[$config]}
done

read -p "Import ssh keys? (Y/N) " import

if [ "${import,,}" == "y" ]
then
    curl https://github.com/dsluo.keys >> $HOME/.ssh/authorized_keys
fi

