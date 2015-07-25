#!/bin/sh
dst="$1"
name=${dst/*\//}
[ -d "$dst" ] || exit 1
rsync -v -a --exclude '*.md' --exclude '*.wav' --exclude 'tmp' --exclude 'tools' --exclude '.*' ./ "$dst"
cp .gitignore "$dst"
echo "--exclude *.wav --exclude *.md --exclude tmp --exclude tools --exclude Makefile tabesugi:public/file/ludumdare.tabesugi.net/$name/" > "$dst"/.rsync
sed -e "s/@@NAME@@/$name/g" tools/template.html > "$dst"/index.html
