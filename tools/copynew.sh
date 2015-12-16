#!/bin/sh
dst="$1"
name=${dst/*\//}
rsyn="$dst/.rsyn"
[ -d "$dst" ] || exit 1
echo "opts='--exclude *.wav --exclude *.md --exclude tmp --exclude tools --exclude Makefile'" > "$rsyn"
echo "remote='tabesugi:public/file/ludumdare.tabesugi.net/ohgj/$name'" > "$rsyn"
mkdir "$dst"/src
mkdir "$dst"/assets
cp .gitignore "$dst"
cp src/*.js "$dst"/src
cp assets/*.png "$dst"/assets
cp assets/*.mp3 "$dst"/assets
cp assets/Makefile "$dst"/assets
sed -e "s/@@NAME@@/$name/g" tools/template.html > "$dst"/index.html
