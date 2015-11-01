#!/bin/sh
dst="$1"
name=${dst/*\//}
[ -d "$dst" ] || exit 1
echo "--exclude *.wav --exclude *.md --exclude tmp --exclude tools --exclude Makefile tabesugi:public/file/ludumdare.tabesugi.net/$name/" > "$dst"/.rsync
mkdir "$dst"/src
mkdir "$dst"/assets
cp .gitignore "$dst"
cp src/*.js "$dst"/src
cp assets/*.png "$dst"/assets
cp assets/*.mp3 "$dst"/assets
sed -e "s/@@NAME@@/$name/g" tools/template.html > "$dst"/index.html
