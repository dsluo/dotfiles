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

