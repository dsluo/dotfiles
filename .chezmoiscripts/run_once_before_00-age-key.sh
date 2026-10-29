#!/bin/sh
# Fetch the age identity that decrypts this repo's encrypted_ files.
set -eu
key="$HOME/.config/chezmoi/key.txt"
[ -f "$key" ] && exit 0
mkdir -p "$(dirname "$key")"
umask 077
op read --out-file "$key" op://chezmoi/age-key/identity
