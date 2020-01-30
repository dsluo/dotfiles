#!/usr/bin/env bash

declare -A configs=(
    ["vimrc"]=".vimrc"
    ["ssh_config"]=".ssh/config"
    ["bashrc"]=".bashrc"
)

for config in "${!configs[@]}"
do
    echo "Linking $config."
    ln -s -i $PWD/$config $HOME/${configs[$config]}
done

read -p "Import ssh keys? (Y/N) " import

if [ "${import,,}" == "y" ]
then
    curl https://github.com/dsluo.keys >> $HOME/.ssh/authorized_keys
fi

