const fs = require("fs");
require("dotenv").config({ path: "./file.env" });
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
//file encryption

const generateKey = (secretKey) => {
  return crypto.pbkdf2Sync(secretKey, "salt", 100000, 32, "sha512");
};

const encryptData = async (data, secretKey) => {
  try {
    // const secretKey = process.env.SECRET_KEY;
    console.log("the value of secret key", secretKey);
    const iv = crypto.randomBytes(16);

    const key = generateKey(secretKey);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encryptedData = cipher.update(data, "utf8", "hex");
    encryptedData += cipher.final("hex");
    return iv.toString("hex") + ":" + encryptedData;
  } catch (err) {
    console.log("Failed while encrypting the file's data", err);
    throw new Error("Failed while encrypting the file's data: " + err.message);
  }
};

//file decryption

const decryptData = async (data, secretKey) => {
  try {
    const parts = data.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedData = Buffer.from(parts.join(":"), "hex");
    const key = generateKey(secretKey);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decryptedData = decipher.update(encryptedData);
    decryptedData = Buffer.concat([decryptedData, decipher.final()]);
    return decryptedData.toString();
  } catch (err) {
    console.log("Failed while decrypting the file's data", err);
    throw new Error("Failed while decrypting the file's data", err.message);
  }
};

const uploadFile = async (req, res) => {
  try {
    const compress = req.body.compress == "on";
    const file = req.file;
    if (compress) {
      // If compress checkbox is checked, compress the file
      const compressedFilePath = file.path ;
      await compressedFile(file.path, compressedFilePath);
      fs.rename(compressedFilePath, `uploads/${file.originalname}`, (err) => {
        if (err) {
          res.status(500).send("Error while uploading file");
        } else {
          res.status(200).send("File uploaded successfully");
        }
      });
    }
    else{
    fs.readFile(file.path, async (err, data) => {
      if (err) {
        return res.status(500).send("Error while reading file");
      }

      try {
        const secretKey = process.env.SECRET_KEY;
        // console.log("the value of the secret key",secretKey);
        const encryptedData = await encryptData(data, secretKey);

        console.log("encrypted data", encryptedData);
        const encryptedFileName = `uploads/file-${Date.now()}.txt`;
        console.log("encrypted name", encryptedFileName);
        fs.writeFile(encryptedFileName, encryptedData, async (err) => {
          if (err) {
            return res.status(500).send("Error while uploading file");
          }
          const decryptedData = await decryptData(encryptedData, secretKey);
          console.log("decryptedData ", decryptedData);
          res.status(200).send("File uploaded successfully");
        });
      } catch (error) {
        console.error("Error encrypting file data:", error);
        res
          .status(500)
          .send({ message: "Failed to upload file", error: error.message });
      }
    });}
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
// File downloadconst
 downloadFile = async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, "../uploads", fileName);
    const compressedRequest = req.query.compress === "true"; 

    if (compressedRequest) {
      const compressedRequestPath = filePath;
      await compressedFile(filePath, compressedRequestPath);
      res.download(compressedRequestPath, fileName);
    } else {

      fs.readFile(filePath, async (err, data) => {
        if (err) {
          return res.status(500).send("Error while reading file");
        }

        try {
          const secretKey = process.env.SECRET_KEY;
          const decryptedData = await decryptData(data, secretKey);
          const decryptedFileName = `decrypted_${fileName}`;

          const decryptedFilePath = path.join(__dirname, "../temp", decryptedFileName);
          fs.writeFile(decryptedFilePath, decryptedData, async (err) => {
            if (err) {
              return res.status(500).send("Error while decrypting file");
            }
            res.download(decryptedFilePath, decryptedFileName, () => {
              fs.unlinkSync(decryptedFilePath);
            });
          });
        } catch (error) {
          console.error("Error decrypting file data:", error);
          res.status(500).send({ message: "Failed to download file", error: error.message });
        }
      });
    }
  } catch (error) {
    console.error("Error while downloading the file", error);
    res.status(500).send({ message: "Unable to download the file", error: error.message });
  }
  };


module.exports = {
  uploadFile,
  deCompressedFile,
  compressedFile,
  encryptData,
  decryptData,
  downloadFile,
  getListFiles,
  searchFile,
};
