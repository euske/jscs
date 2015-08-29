#!/bin/sh
sed 's/<script[^>]*src="\([^"]*\)".*/\1/;t;d;' "$@" | xargs cat | jshint -
