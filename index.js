const fs=require('fs');
fs.appendFile(path.join(__dirname,'data','file.js'),(err,data)=>{
    if(err)throw error;
    console.log('created new file');
})