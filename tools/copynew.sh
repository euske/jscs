#!/bin/sh
dst="$1"
rsync -v -a ./ "$dst" --exclude '.*'
cp .gitignore .rsync "$dst"
