#!/usr/bin/env bash

typst compile --root . --font-path .fonts --pdf-standard=2.0 "$@"
