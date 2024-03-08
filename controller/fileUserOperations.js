const fs = require("fs");
// const error = require("errorhandler");
const zlib = require("zlib");
const crypto=require('crypto');
const express = require('express');
const app = express();

export const uploadFile = async () => {
  return new Promise((resolve, reject) => {
    try {
      fs.readdir("uploads", (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

//search file name or by metadata
//it needs to check is not completed yet
export const searchFile = async (req,res) => {
  try {
    const searchItem=req.params.searchItem;
    const files = await fs.promises.readFile("./uploads");
    const result = files.filter(file=>{
        file.includes(searchItem);
    });

    // for (const file of files) {
    //   if (file.includes(searchItem)) {
    //     //extract metadata for each file
    //     const statFile = await fs.stat(`./uploads/{file}`);
    //     result.push({
    //       name: file,
    //       size: statFile.size,
    //     });
    //   }
    // }
    res.status(200).send({result});
   
  } catch (err) {
    console.log("error wile searching for specifc file"+err.message);
 res.status(500).send({message:"unable to find search item "});
  }
};

//Compression file
export const compressedFile = async (inputFile,outputFile) => {
  try {
    const gzip = zlib.createGzip();
    const inp = fs.createReadStream(inputFile );
    const out = fs.createWriteStream(outputFile+ ".gz");
    inp.pipe(gzip).pipe(out);
    console.log("file is compressed successfully"); 
  } catch (err) {
    throw new Error("Error while compressing the file"+err.message);
  }
};

//Compression file
export const deCompressedFile = async (inputFile,outputFile) => {
  try {
    const unzip = zlib.createUnzip();
    const inp = fs.createReadStream(inputFile);
    const out = fs.createWriteStream(outputFile);
    inp.pipe(unzip).pipe(out);
    console.log("file is decompressed successfully");
  } catch (err) {
    console.log("file is decompressed failed"+err.message);
    throw new Error("Error while decompressing to new file"+err.message);
  }
};


//file encryption

export const encryptData=async(data)=>{
  try{
    const secretKey='my-secret-key';

const cipher=crypto.createCipher("aes-256-ccm",secretKey);
let encryptData=cipher.update(data,'utf8','hex');
encryptData += cipher.final('hex');
return encryptData;
  }
  catch(err){
    console.log("Filed while encrypted the file's data"+err);
    throw new Error("Filed while encrypted the file's data",err.message)
  }
}
//file decryption
export const decryptedData=async (data)=>{
  try{
    const secretKey='my-secret-key';

  const decipher=crypto.createDecipher("aes-256-ccm",secretKey);
  const decryptData=decipher.update(data,'utf8','hex');
  decryptData +=decipher.final('utf8');
  return decryptData;
  }
  catch(err){
    console.log("Failed while decrypted the file's data"+err);

    throw new Error("Filed while decrypted the file's data",err.message)
  }
}


//list all files 
export const getListFiles=async(req,res)=>{
  const filePath="./data";
try {
  const files =await fs.promises.readdir("./data");
  res.status(200).send({files});
} catch (error) {
  console.log("error getting list of files",error);
  throw new Error("failed to list files",error.message);
}
}


//file download
export const  downloadFile=async(req,res)=>{
try {
  const fileName=req.params.fileName;
  const filePath="./data"+ fileName;
res.downloadFile(filePath,fileName);

} catch (error) {
  res.status(500).send({message:"unable to download the file "})
  throw new Error("Filed while downloading the file",err.message)

}
}
