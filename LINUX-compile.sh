#!/bin/sh


#first run install script 

sudo npm install -g pkg
pkg mangaScrape.js -t node18-linux-x64
sudo cp mangaScrape /usr/local/bin
