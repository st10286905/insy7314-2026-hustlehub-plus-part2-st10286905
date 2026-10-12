#!/usr/bin/env bash

OG_DIR=$(pwd)
PRETTIER_DIR="$HOME/.cache/prettier"

mkdir -p "$PRETTIER_DIR"
cd "$PRETTIER_DIR"

npm install -D prettier mermaid-formatter
tee .prettierrc > /dev/null <<EOF
{
  "plugins": ["mermaid-formatter/prettier-plugin"]
}
EOF

cp -lr "$OG_DIR" "$PRETTIER_DIR/pretty"
npx prettier --write "**/*.md"

cd "$OG_DIR"
rm -rf "$PRETTIER_DIR"
