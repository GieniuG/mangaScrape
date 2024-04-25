const needle = require('needle')
const fs=require("fs")
const cheerio=require("cheerio")


let url="https://mangakatana.com/manga/bleach.47"

function getChapters(url,startChapter,endChapter){
    let finalArray=[]
    let array=[]
    
    return new Promise((resolve)=>{
    needle.get(url,(err,response)=>{
        let html=response.body
        const $=cheerio.load(html,null,false)
        let elements=$(".chapters tbody a")
        elements.each((index,element)=>{
            let url=$(element).attr("href")
            chapter=url.split("/")
            array.push({
                chapter:chapter[chapter.length-1].replace("c",""),
                url:url
            })
        })
    let index=array.length-1
    
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
// getChapters(url)

async function test(){
    let resp=await getChapters(url,10,26)
    for(i=0;i<resp.length;i++){
        console.log(`progres: ${i+1}/${resp.length}`)
        console.log(`downloading chapter: ${resp[i].chapter}`)
        console.log(resp[i].url)
    }
}

test()