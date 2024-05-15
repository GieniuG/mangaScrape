const cheerio = require("cheerio")
const fs = require('fs')
const readlineSync = require('readline-sync')                                       //for terminal input
const JSZip = require("jszip")
const path = require("path")
const puppeteer = require("puppeteer-core")
const needle = require('needle')
const os = require('os')
const natural = require('natural');                                                 //compare two strings with some tolerance for typos


let shouldPrint=true
let chosenMangaDir
let titles=[]
let latestChapter

let pathToDownloadDir
let howManyTitles
let doneMessage
let pathToBrowser

const platform=os.platform()
if(platform=="win32"){
    getConfig(`C:\\Program Files\\mangaScrape\\.config.json`)

}else if(platform=="linux"){
   getConfig(`${process.env.HOME}/.config/mangaScrape/config.json`)
}else if(platform=="darwin"){
    // for mac - coming soon
}


async function search(name){
    return new Promise((resolve)=>{
    let url="https://mangakatana.com/?search="
    let button
    let nameArray=name.split(" ")
    nameArray.forEach((element,index)=>{
        if(index!=0){
            element="+"+element
        }
        url+=element
    })
    url+="&search_by=book_name"  
    needle.get(url,{ follow_max: 5 },(err,response)=>{
    const html=response.body
    const $=cheerio.load(html,null,false)
    button=$(".bookmark_bt").html() 
    if(button==null){                                                                             //checks if there is more than one manga
        titles=$(".title a")
        titles.length>howManyTitles?"":howManyTitles=titles.length                                //prevents error of following loop if there are less than 10 titles
        for(let i=0;i<howManyTitles;i++){
            let $title=$(titles[i])
            titles[i]={
                name: $title.html(),
                link: $title.attr("href")
            }
        }   
    }else{
        print("only one matching")
        titles[0]={
            name:$(".heading").html(),
            link:response.url
        }
    }
    resolve()
})
})
}



async function scrape(chapters){
    const browser=await puppeteer.launch({
        headless: 'shell',
        executablePath: pathToBrowser
    })
    const page = await browser.newPage()
    print("loading...")
    try {
        for(i=0;i<chapters.length;i++){
            await page.goto(chapters[i].url)
            await page.waitForSelector('.wrap_img');
            try{
                var html = await page.content()
            } catch(error){
                console.log("puppeteer error:",error)
            }
            const $=cheerio.load(html,null,false)
            const wrappers=$(".wrap_img img").toArray()
            const numberOfPages=wrappers.length

            if($(wrappers[0]).attr("data-src")!="https://mangakatana.com/imgs/coming_soon.jpg?v=2"){
            fs.mkdir(`${chosenMangaDir}/Chapter${chapters[i].chapter}`, err=>err?console.log("MKDIR  ERROR:",err):"")         //create a directory 
                print(`progress: ${i+1}/${chapters.length}`)
                print(`downloading: ${chapters[i].chapter}`)

                wrappers.forEach((image,index)=>{
                   src=$(image).attr("data-src")                                                                              //get source url 
                   needle.get(src ,{ responseType: 'buffer' },(error,response)=>{                                             //fetch image data
                    fs.writeFile(`${chosenMangaDir}/Chapter${chapters[i].chapter}/page${index+1}.jpg`,response.body,err=>err?console.log(err):"")          
                   })
                })                                                    
            pathToChapter=`${chosenMangaDir}/Chapter${chapters[i].chapter}`
                await validateDownload(numberOfPages,pathToChapter)
                    .catch(error=>console.log("error validating download",error))
                await pause(2500)                                                                                   //pause, so that images can render
                await archive(pathToChapter)                                                                        //create .cbz file
                remove(pathToChapter)                                                                               //remove directory
                print("done")
        }
      }
    } finally {
        browser.close()
        console.log(doneMessage)
    }
}

function getChapters(url,chapter){
    let finalArray=[]
    let array=[]
    let startChapter,endChapter 

    return new Promise((resolve)=>{
    needle.get(url,(err,response)=>{
        let html=response.body
        const $=cheerio.load(html,null,false)
        let elements=$(".chapters tbody a")
        elements.each((index,element)=>{
            let url=$(element).attr("href")
            let chapter=url.split("/")
            array.push({
                chapter:chapter[chapter.length-1].replace("c",""),
                url:url
            })
        })
    let index=array.length-1
    if(chapter!="a"){
            let chapterArray=chapter.split("-")
            startChapter=Number(chapterArray[0])
            if(chapterArray.length>1){
                endChapter=Number(chapterArray[1])
            }else{
                endChapter=startChapter
            }
    }else{
        startChapter=array[array.length-1].chapter
        endChapter=array[0].chapter
    }
    while(index>=0){
        if(startChapter<=array[index].chapter){
        finalArray.push(array[index])
            if(endChapter==array[index].chapter){
               break
            }
        }
        index--
    }
    resolve(finalArray)
  })
 })
}

function archive(pathToChapter){                                                  //convert to .cbz                                                                        
    const pathToMangaDir=path.join(pathToChapter, "..")
    const zipName = path.basename(pathToChapter)
    const zipFileName=`${pathToMangaDir}/${zipName}.cbz`

    return new Promise((resolve,reject)=>{
        fs.readdir(pathToChapter,async (err,files)=>{
            if(err){ 
                console.log(err)
                reject(err)
            }
            const zip= new JSZip()
            const addFileToZip=(zipFile,filePath)=>{
                const fileContent = fs.readFileSync(filePath)
                const fileName = path.basename(filePath)
                zipFile.file(fileName, fileContent)
            }
            for(const file of files){
                addFileToZip(zip,`${pathToChapter}/${file}`)
            }
            await zip.generateAsync({type: "nodebuffer"}).then((content)=>{
                fs.writeFileSync(zipFileName,content)
            })
        })
        resolve()
    })
}

function remove(pathToChapter){                                                                       //delete directory
    fs.rm(pathToChapter,{recursive: true}, err=>{
        err?console.log("removerERROR: ",err):""
    })
}
function pause(time){
    return new Promise(resolve=>{
        setTimeout(resolve,time)
    })
}
function validateDownload(numberOfPages,pathToChapter){
    return new Promise((resolve,reject)=>{
        const loop=()=>{
            fs.readdir(pathToChapter,(err,files)=>{
                const numberOfFiles=files.length
                if(numberOfFiles==numberOfPages){
                    resolve()
                }else{
                    loop()
                }
            })
        }
        loop()
    })
}

async function prepairStructure(chosenManga){
    chosenMangaDir=pathToDownloadDir+`/${titles[chosenManga].name}`
    if(!fs.existsSync(chosenMangaDir)){                                                          //if directory for manga does not exist
        fs.mkdir(chosenMangaDir, err=>err?console.log(err):"")                                   //create one
        needle.get(titles[chosenManga].link,(error,response)=>{
        const html=response.body
        const $=cheerio.load(html,null,false)
        const coverURL=$(`meta[property="og:image"]`).attr("content")
        needle.get(coverURL,{ responseType: 'buffer' },(error,response)=>{                                                                //fetch image data                                                           
            fs.writeFile(`${chosenMangaDir}/cover.jpg`,response.body,err=>err?console.log(err):"")          
        })
        const status=$(".status").html()
        append({name:titles[chosenManga].name,link:titles[chosenManga].link,scan:status=="Completed"?false:true})      //add manga to JSON file
    })
    }  
}
function append(object){                                                                          //append name,link and scan to json file
    const jsonFile=pathToDownloadDir+"/library.json"

    fs.readFile(jsonFile,"utf8",(err,data)=>{
        if(err){
            console.log("error:",err)
            return
        }
    let items=[]
    items=JSON.parse(data)
    items.push(object)
    const jsonData = JSON.stringify(items,null,2)
    fs.writeFile(jsonFile,jsonData,err=>err?console.log(err):"")
    })
}


const args = process.argv.slice(2);                                                              //cmd input

async function start(passedArguments){
    let chosenOptions={
        name:null,
        url:null,
        chapter:null,
        index:null,
    }
    for(let i=0;i<passedArguments.length;i++){                                                   //assign passed values
        switch(passedArguments[i]){
            case "-u":
                if(passedArguments[i+1][0]=="-")
                    break
                chosenOptions.url=passedArguments[i+1]
                break
            case "-c":
                if(passedArguments[i+1][0]=="-")
                    break
                chosenOptions.chapter=passedArguments[i+1]
                break
            case "-n":
                if(passedArguments[i+1][0]=="-")
                    break
                chosenOptions.name=passedArguments[i+1]
                break
            case "-i":
                if(passedArguments[i+1][0]=="-")
                    break
                chosenOptions.index=passedArguments[i+1]
                break
            case "-s":
                shouldPrint=false
                i--
                break
            case "-a":
               chosenOptions.chapter="a" 
            break 
            case "-d":
                let nameOfTheManga=""
                if(!passedArguments[i+1] || passedArguments[i+1][0]=="-")
                    return
                nameOfTheManga=await checkName(passedArguments[i+1])
                if(nameOfTheManga!=null)
                    console.log(`Your newest downloaded chapter of ${nameOfTheManga} is ${await checkNewestDownloadedChapter(nameOfTheManga)}`)
                else
                    console.log("No manga of such name")
            return 
            case "-l":
                changeScanStatus(false)
                return
            case "-m":
                changeScanStatus(true)
                return
            case "-h":
                if(platform=="win32"){
                    var location='C:\\Progarm Files\\mangaScrape'
                }else if(platform=="linux"){
                    var location=`${process.env.HOME}/.config/mangaScrape`
                }
                else if(platform=="darwin"){
                    var location="i don't know yet"
                }
                help(location)
                return
            case "-U":
                await checkForUpdate()
                if(passedArguments.includes("-D")){
                    for(const element of titles){
                        print(element.name)
                        prepairStructure(titles.indexOf(element))
                        let chapters=await getChapters(element.url,`${Number(element.chapter[0])+0.00001}-${element.chapter[1]}`)
                        await scrape(chapters)
                    }
                }
                return
            default:
                console.log("unknown option:",passedArguments[i]+"; skipping")
                break
            }
            i++
        }
        if(chosenOptions.url){                                                              //get name of manga if provided url
            await new Promise(resolve=>{
            needle.get(chosenOptions.url,(error,response)=>{          
            const html=response.body                                          
            const $=cheerio.load(html,null,false)     
            titles[0]={
                name:$(".info .heading").html(),
                link:chosenOptions.url
            }   
            resolve()
        })
        })
        }
        if(chosenOptions.url==null && chosenOptions.name==null){                            //if no url or name provided, ask for the name
            chosenOptions.name=readlineSync.question("Name of manga: ")
        }
        if(chosenOptions.url==null){                                                        //check for list of aviable manga if the url is null
            await search(chosenOptions.name)
        }
        if(chosenOptions.index==null && chosenOptions.url==null && titles.length>1){        //if index/url is null or only one manga is found, ask for index 
            for(let i=0;i<howManyTitles;i++){
                print(i+" "+titles[i].name)
            }
            chosenOptions.index=readlineSync.question("Index: ")
        }
        if(titles.length<=1){
            chosenOptions.index=0
        }
        if(chosenOptions.chapter==null){                                                                   //if no chapter provided, ask for them
            await new Promise(resolve=>{
            needle.get(titles[chosenOptions.index].link,(err,response)=>{                                    //go into chosen manga for the latest chapter info
            const html=response.body
            const $=cheerio.load(html,null,false)                   
            latestChapter=$("table .chapter a").html().split(" ")[1].replace(":","") 
            print("latest chapter: "+latestChapter)            
            chosenOptions.chapter=readlineSync.question("Chapter(s): ")
            resolve()
        })
        })
        }
        prepairStructure(chosenOptions.index)
        let chapters=await getChapters(titles[chosenOptions.index].link,chosenOptions.chapter)
        scrape(chapters)
}
 

function help(location){
console.log(`Usage: mangaScrape [flags]

Flags:
  -U       Check for new chapters. If used alone, it will only check for updates.
           When used with -D, it will automatically download new chapters.
  -D       Automatically download new chapters. Must be used with -U.
  -u       Provide a manga URL. This is useful for scripts. Example: -u https://mangakatana.com/manga/kuroshitsuji.546
  -c       Choose a chapter or range of chapters to download.
              Single chapter: -c 1
              Range of chapters: -c 1-10
  -n       Choose the name of the manga. Use quotes for multi-word names. Examples: -n Naruto, -n "Fairy Tail"
  -i       Choose the index of the manga. The index is the position it appears when searching its name, starting from 0.
  -s       Silent mode. Only displays errors, prompts for missing parameters, and the end message.
  -h       Display this help message.
  -l       List name and scan status from library file.
  -m       Toggle between true and false scan status.
  -d       Display the newest downloaded chapter for a manga. This feature accommodates minor typos in the manga name for flexible searches.
  -a       Download all chapters (use insted of -c)

Additional Notes:
- If you can't find your manga listed here, consider using the -u flag with the manga's URL.
- You can adjust the number of titles to search for by changing the "howManyTitles" value in the config file located at ${location}.
- You can modify the end message in the config file.
`)
}
start(args)

function checkName(providedName){
    return new Promise((resolve)=>{
    const jsonString=fs.readFileSync(pathToDownloadDir+"/library.json","utf8")
    const jsonFile=JSON.parse(jsonString)
    let highestRes={
        score:0,
        name:"",
    }
    for(const element of jsonFile){
        score=natural.JaroWinklerDistance(providedName.toLowerCase(),element.name.toLowerCase())
        if(score==1){
            resolve(element.name)
        }
        if(score>highestRes.score){
            highestRes.score=score
            highestRes.name=element.name
        }
    }
    if(highestRes.score>0.75){
        resolve(highestRes.name)
    }else{
        resolve(null)
    }
})
}
async function checkForUpdate(){
    const jsonString=fs.readFileSync(pathToDownloadDir+"/library.json","utf8")
    const jsonFile=JSON.parse(jsonString)
for(const manga of jsonFile){
    if(manga.scan){
       await new Promise(resolve=>{
        needle.get(manga.link,async (err,response)=>{                                              //go into chosen manga for the latest chapter info
        const html=response.body
        const $=cheerio.load(html,null,false)        
            let newestDownloadedChapter=await checkNewestDownloadedChapter(manga.name)
            
            if($(".status").html()=="Completed"){
                print(`${manga.name} is completed. Changing scan status in the library ...`)
                jsonFile[jsonFile.indexOf(manga)].scan=false
                fs.writeFile(pathToDownloadDir+"/library.json",JSON.stringify(jsonFile,null,2),(error)=>error?console.log(error):"")
            }
            
            let newChapter=Number($("table .chapter a").html().split(" ")[1].replace(":",""))
            if(newestDownloadedChapter<newChapter){
                titles.push({
                    name:manga.name,
                    url:manga.link,
                    chapter:[newestDownloadedChapter,String(newChapter)],
                })
                print(`${manga.name}  (${newestDownloadedChapter}/${newChapter})`) 
            }
            resolve()
        })
        })//end of promise
        }
    }
}

function checkNewestDownloadedChapter(name){
    return new Promise(async (resolve,reject)=>{
    const files=await new Promise((resolve,reject)=>{
        fs.readdir(`${pathToDownloadDir}/${name}`,(err,files)=>{
            if(err){
                console.log("ERROR:",err)
                reject(err)
            }else resolve(files)
        })
    })
        files.forEach((element,index)=>{
            if(path.extname(element)==".cbz"){
                files[index]=Number(path.basename(element, path.extname(element)).replace("Chapter",""))
            }else{
                files.splice(index,1)
            }     
        })
        resolve(Number(Math.max(...files)))
    })
}
function print(string){
    if(shouldPrint){
        console.log(string)
    }
}

function getConfig(path){
    const jsonString=fs.readFileSync(path,"utf8")
    const jsonFile=JSON.parse(jsonString)
    pathToDownloadDir=jsonFile.pathToDownloadDir
    howManyTitles=jsonFile.howManyTitles
    doneMessage=jsonFile.doneMessage
    pathToBrowser=jsonFile.pathToBrowser
}

function changeScanStatus(modify){
    const jsonString=fs.readFileSync(pathToDownloadDir+"/library.json","utf8")
    const jsonFile=JSON.parse(jsonString)


    let longestNameLength=0
    jsonFile.forEach((element)=>{
        if(element.name.length>longestNameLength){
            longestNameLength=element.name.length
        }
    })
    
    let tableHead={
        index:"index",
        name:"",
        scan:"scan status",
        newestChapter:0
    }
    for(let i=0;i<parseInt((longestNameLength-4)/2);i++){
        tableHead.name+=" "
    }
    tableHead.name+="name"
    for(let i=0;i<parseInt((longestNameLength-5)/2);i++){
        tableHead.name+=" "
    }
    console.log(`${tableHead.index} | ${tableHead.name}  | ${tableHead.scan}`)
    let divider=""
    for(let i=0;i<longestNameLength+22;i++){
        if(i==6 || i==longestNameLength+9) divider+="+"
        else divider+="-"
    }
    console.log(divider)
    // disaply everything \/
    jsonFile.forEach(async (element,index)=>{
        let name=element.name
        for(let i=0;i<longestNameLength-element.name.length;i++){
            name+=" "
        }
        for(let i=0;i<8-String(index).length;i++){
            index+=" "
        }
        console.log(index,"|",name,"|",element.scan)
    })


    if(modify){
        const chosenIndex=readlineSync.question("\nWhat manga do you want to change? (index): ")
        jsonFile[chosenIndex].scan=jsonFile[chosenIndex].scan?false:true

        const jsonData = JSON.stringify(jsonFile,null,2)
        fs.writeFile(pathToDownloadDir+"/library.json",jsonData,err=>err?console.log(err):"")
    }
}
