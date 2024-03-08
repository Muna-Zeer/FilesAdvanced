const fs = require("fs");
// const error = require("errorhandler");
const zlib = require("zlib");
const crypto = require("crypto");
const express = require("express");
const path = require("path");
const app = express();

//search file name or by metadata
//it needs to check is not completed yet
const searchFile = async (req, res) => {
  try {
    const { searchItem } = req.query;
    const directories = ["./uploads", "./data"];
    const searchResult = [];
    for (const directory of directories) {
      const files = await fs.readdir(directory);
      const result = files.filter((file) => file.includes(searchItem));
      searchResult.push(...result);
    }
    res.status(200).send({ result: searchResult });
  } catch (error) {
    console.log("Error while searching for specific file: " + error.message);
    res.status(500).send({ message: "Unable to find search item" });
  }
};

//Compression file
const compressedFile = async (inputFile, outputFile) => {
  try {
    console.log("Input File:", inputFile);
    console.log("Output File:", outputFile);
    const gzip = zlib.createGzip();
    const inp = fs.createReadStream(inputFile);
    const out = fs.createWriteStream(outputFile + ".gz");
    inp.pipe(gzip).pipe(out);
    console.log("file is compressed successfully");
  } catch (err) {
    throw new Error("Error while compressing the file: " + err.message);
  }
};

const uploadFile = async (req, res) => {
  try {
    const compress = req.body.compress == "on";
    const file = req.file;
    let filePath = file.path;
    if (compress) {
      const compressedFilePath = file.path;
      await compressedFile(file.path, compressedFilePath);
      filePath = compressedFilePath;
    }
    fs.rename(file.path, `uploads/${file.originalname}`, (err) => {
      if (err) {
        res.status(500).send("Error while uploading file");
      } else {
        res.status(200).send("File uploaded successfully");
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res
      .status(500)
      .send({ message: "Failed to upload file", error: error.message });
  }
};

//eCompression file
const deCompressedFile = async (inputFile, outputFile) => {
  try {
    const unzip = zlib.createUnzip();
    const inp = fs.createReadStream(inputFile);
    const out = fs.createWriteStream(outputFile);
    inp.pipe(unzip).pipe(out);
    console.log("file is decompressed successfully");
  } catch (err) {
    console.log("file is decompressed failed" + err.message);
    throw new Error("Error while decompressing to new file" + err.message);
  }
};

//file encryption

const encryptData = async (data) => {
  try {
    const secretKey = "my-secret-key";

    const cipher = crypto.createCipher("aes-256-ccm", secretKey);
    let encryptData = cipher.update(data, "utf8", "hex");
    encryptData += cipher.final("hex");
    return encryptData;
  } catch (err) {
    console.log("Filed while encrypted the file's data" + err);
    throw new Error("Filed while encrypted the file's data", err.message);
  }
};
//file decryption
const decryptedData = async (data) => {
  try {
    const secretKey = "my-secret-key";

    const decipher = crypto.createDecipher("aes-256-ccm", secretKey);
    const decryptData = decipher.update(data, "utf8", "hex");
    decryptData += decipher.final("utf8");
    return decryptData;
  } catch (err) {
    console.log("Failed while decrypted the file's data" + err);

    throw new Error("Filed while decrypted the file's data", err.message);
  }
};

const getListFiles = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../uploads");
    const filesList = await fs.readdir(uploadDir);
    console.log("fileslist", filesList);
    res.status(200).send({ filesList });
  } catch (error) {
    console.log("Error getting list of files", error);
    res
      .status(500)
      .send({ message: "Failed to list files", error: error.message });
  }
};
// File download
const downloadFile = async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, "../uploads", fileName);
    const compressedRequest = req.query.compress = "true";
    if (compressedRequest) {
      const compressedRequestPath = filePath ;
      await compressedFile(filePath, compressedRequestPath);
      res.download(compressedRequestPath, fileName );
    } else {
      res.download(filePath, fileName);
    }
  } catch (error) {
    console.error("Error while downloading the file", error);
    res
      .status(500)
      .send({ message: "Unable to download the file", error: error.message });
  }
};

module.exports = {
  uploadFile,
  deCompressedFile,
  compressedFile,
  encryptData,
  decryptedData,
  downloadFile,
  getListFiles,
  searchFile,
};
