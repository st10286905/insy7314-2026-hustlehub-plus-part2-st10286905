#!/usr/bin/env bash

parent_dir() {
    echo "$(cd -- "$(dirname -- "$1")" 2>/dev/null && pwd || echo "$(dirname -- "$1")")"
}

# cd into project directory
cd "$(parent_dir "$0")/.."

# Init node_modules
if [[ ! -e "node_modules" ]]; then
    npm install
fi

# Init .env
if [[ ! -e ".env" ]]; then
    cp .env.example .env
fi
# Load .env vars
export $(grep -v '^#' .env | xargs)

# Init secrets
[[ ! -e "$SSL_KEY_PATH" || ! -e "$SSL_CERT_PATH" ]] && {
    # Create parent directories if needed
    { pdir="$(parent_dir "$(pwd)/$SSL_KEY_PATH")" && [[ -e "$pdir" ]] || mkdir -p "$pdir"; }
    { pdir="$(parent_dir "$(pwd)/$SSL_CERT_PATH")" && [[ -e "$pdir" ]] || mkdir -p "$pdir"; }

    # Create openssl key and cert
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 -subj "/CN=localhost" \
        -keyout "$(pwd)/$SSL_KEY_PATH" \
        -out "$(pwd)/$SSL_CERT_PATH"
}

