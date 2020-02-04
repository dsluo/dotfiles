" General
set nocompatible
filetype plugin on
syntax on

" Colors
colorscheme slate

" Looks

" line numbers
set number
" highlight trailing whitespace
highlight ExtraWhitespace ctermbg=darkgreen guibg=darkgreen
match ExtraWhitespace /\s\+$/
" highlight current line
set cursorline
set hlsearch

" Behavior
set mouse=a
" enable auto-reload of saved files
set autoread

" Tabs
" use spaces
set expandtab
" backspace deletes 1 tab worth of spaces
set smarttab
" tabs are 4 spaces
set tabstop=4
" indent with 4 spaces
set shiftwidth=4
set autoindent

" for json, use 2 spaces instead of 4
autocmd BufRead,BufNewFile *.json setlocal tabstop=2
autocmd BufRead,BufNewFile *.json setlocal shiftwidth=2

command! W execute 'w !sudo tee % > /dev/null' <bar> edit!

" Plugins

" autoinstall vim-plug
if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  autocmd VimEnter * PlugInstall --sync | source $MYVIMRC
endif

call plug#begin('~/.vim/plugged')

Plug 'metakirby5/codi.vim'

call plug#end()
