<p  align="center">
	<img src="assets/logo.png">
</p>


## TABLE OF CONTENTS

- [GETTING STARTED](#getting-started)
  - [INSTALLATION](#installation)
    - [LINUX](#linux)
    - [WINDOWS](#windows)
    - [MAC](#mac)
- [USAGE](#usage)
- [FEATURES](#features)
- [CONTRIBUTIONS](#contributions)
- [CONTACT](#contact)

## GETTING STARTED

### INSTALLATION

#### LINUX

1. Install Node.js from [Node.js website](https://nodejs.org/)

If you're using a Chromium-based browser, you don't need to perform the next step:

2. Run (while in the directory containing .js file) `npx @puppeteer/browsers install chrome-headless-shell@stable` to download the browser this program will be using.
3. Go into `LINUX-install.sh` and remove the comments.
   If you want to use your browser instead of downloading headless chrome, run `which browser_name` and change the `pathToBrowser` at line 15 to the output of this command. For example, for Brave:

   ```
   pathToBrowser="/usr/bin/brave"
   ```
4. While in the main directory (with the .js file), run:

```
   chmod +x LINUX-install.sh
   ./LINUX-install.sh
```

You're good to go!

#### WINDOWS

Coming soon.

#### MAC

It might take a while, but I'm planning to do that too.

## USAGE

Usage: mangaScrape flags

Flags:

```
-U   Check for new chapters. If used alone, it will only check for updates.
         When used with `-D`, it will automatically download new chapters.
  
-D   Automatically download new chapters. Must be used with `-U`.
  
-u   Provide a manga URL. This is useful for scripts. Example: `-u https://mangakatana.com/manga/kuroshitsuji.546`
  
-c   Choose a chapter or range of chapters to download.
            Single chapter: -c 1
            Range of chapters: -c 1-10
  
-n   Choose the name of the manga. Use quotes for multi-word names. Examples: `-n Naruto`, `-n "Fairy Tail"`
  
-i   Choose the index of the manga. The index is the position it appears when searching its name, starting from 0.
  
-s   Silent mode. Only displays errors, prompts for missing parameters, and the end message.
  
-h   Display this help message.

-l   List name and scan status from library file.

-m   Toggle between true and false scan status.

-d   Display the newest downloaded chapter for a manga. This feature accommodates minor typos in the manga name for flexible searches.

-a   Download all chapters (use insted of -c)
```

You don't need to use the flags at all; it will ask you for the stuff it needs, so you don't have to worry too much about it.

**EXAMPLES:**

- You only know that you want to download chapters from 1 to 10 of Naruto, but you don't know the index:
  `mangaScrape -n Naruto -c 1-10`
- You want to check if manga you downloaded has new chapters:
  `mangaScrape -U`


<p align="center">
<img src="assets/usage.gif">
</p>

## FEATURES

- Batch download
- Checks for new chapters
- Easy integration with scripts for automation
- Downloads cover images automatically

## CONTRIBUTIONS

Contributions and new ideas are appreciated, so if you want something to be added, feel free to suggest it.

## CONTACT

DISCORD: gieniu_g
