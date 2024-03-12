#!/bin/sh

# remove following "#" if you want to compile
# if ! command -v npm &> /dev/null
# then
#     echo "npm is not installed. Please install Node.js, which includes npm, from https://nodejs.org/. And run 'npm install pkg'"
#     exit 1
# fi
# 
# pkg mangaScrape.js -t node18-linux-x64

mkdir $HOME/.mangaScrape/
mkdir "$HOME/.mangaScrape/Downloaded Manga"
cp chrome-headless-shell $HOME/.mangaScrape/
mkdir $HOME/.config/mangaScrape/
echo "{
 \"pathToDownloadDir\":\"$HOME/.mangaScrape/Downloaded Manga\",
 \"howManyTitles\":\"10\",
 \"doneMessage\":\"Everything done. Happy reading!\"
}" > $HOME/.config/mangaScrape/config.json
sudo cp mangaScrape /usr/local/bin
