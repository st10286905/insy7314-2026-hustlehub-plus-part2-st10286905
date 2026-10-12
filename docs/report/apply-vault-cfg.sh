#!/usr/bin/env bash

cont_prompt() {
    read -p "$1 (y/n): " -n 1 -r; \
        echo; [[ ! $REPLY =~ ^[Yy]$ ]] && return 1
    return 0
}

git clean -fdX --dry-run
cont_prompt "Remove existing files above?" \
    && git clean -fdX

cont_prompt "Apply project's default obsidian settings?" \
    && cp -r .obsidian.default .obsidian
