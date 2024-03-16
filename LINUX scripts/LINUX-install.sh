#!/bin/sh

#if you don't have npm installed, install Node.js (https://nodejs.org/), which includes npm
#run 'npx @puppeteer/browsers install chrome-headless-shell@stable' while in the same directory as mangaScrape.js

echo "check that file for a moment!!"

#remove # from lines below only after doing things above

# mkdir $HOME/.mangaScrape/
# mkdir "$HOME/.mangaScrape/Downloaded Manga"
# echo "[]" > "$HOME/.mangaScrape/Downloaded Manga/library.json"
# cp -r ../chrome-headless-shell $HOME/.mangaScrape/
# pathToBrowser=`find $HOME/.mangaScrape/chrome-headless-shell/linux-*/chrome-headless-shell-linux64/chrome-headless-shell`
# mkdir $HOME/.config/mangaScrape/
# echo "{
# \"pathToDownloadDir\":\"$HOME/.mangaScrape/Downloaded Manga\",
# \"howManyTitles\":\"10\",
# \"doneMessage\":\"Everything done. Happy reading!\",
# \"pathToBrowser\":\"$pathToBrowser\"
# }" > $HOME/.config/mangaScrape/config.json
# sudo cp ../mangaScrape /usr/local/bin
