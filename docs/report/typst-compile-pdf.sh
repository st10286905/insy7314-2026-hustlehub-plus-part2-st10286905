#!/usr/bin/env bash

typst compile --font-path .fonts --pdf-standard=2.0 "$@"
