const multer = require("multer");
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
//export user functions
const {uploadFile,searchFile,compressedFile,deCompressedFile,encryptData,decryptData,
    getListFiles,downloadFile} =require("./controller/fileUserOperations");
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const storage = multer.diskStorage({
    destination: "./uploads",
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage:storage}).single("file");


app.get("/create", (req, res) => {
  res.render("create");
});

app.post("/create", (req, res) => {
  const { fileName, fileContent } = req.body;
  const allowedExtentions = [".js", ".txt", ".json", ".css",".pdf"];
  const ext = path.extname(fileName);
  if (!allowedExtentions.includes(ext)) {
    res.status(400).send("un supported ext file");
    return;
  }
  const filePath = `./data/${fileName}`;

  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      console.error("Error creating file", err);
      res.status(500).send("Error while creating file");
      return;
    }
    console.log("Created file successfully", fileName);
    res.redirect("/");
  });
});

// Read files from data dir and then display them
app.get("/", (req, res) => {
  fs.readdir("./data", (err, files) => {
    if (err) {
      console.log("error reading files", err);
      res.status(500).send("Error while reading files");
      return;
    }
    res.render("index", { files });
    console.log("Read files successfully", files);
  });
});

// Update file based on the current file name
app.get("/files/:filename/edit", (req, res) => { 
  const fileName = req.params.filename;
  fs.readFile(`./data/${fileName}`, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      res.status(404).send("File not found");
    } else {
      res.render("update", { fileName, data });
    }
  });
});

// Handle post request to update file name
app.post("/files/:filename/update", (req, res) => {
  const fileName = req.params.filename;
  const newFileName = req.body.newFileName;

  // Update file name
  fs.rename(`./data/${fileName}`, `./data/${newFileName}`, (err) => {
    if (err) {
      console.error("Error updating file name:", err);
      res.status(500).send("File name update failed");
    } else {
      console.log("File name updated successfully");
      res.redirect("/");
    }
  });
});

// Handle delete specific file
app.get("/files/:filename/delete", (req, res) => {
  const fileName = req.params.filename;
  console.log("filename",fileName);
  const filePath = `./data/${fileName}`;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log("Error  deleting file", err);
      res.status(500).send("Failed to delete file");
    } else {
      
      console.log("File deleted successfully:", fileName);
    //   res.send("<script>alert('File ${fileName} deleted successfully')</script>")
      res.redirect("/");
    }
  });
});

// View file name and the content of files
app.get("/files/:filename", (req, res) => {
    const fileName = req.params.filename;
    console.log("filename",fileName);
    const filePath = `./data/${fileName}`;
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.log("Failed to access file name and content", err);
        res.status(404).send("File not found");
      } else {
        res.render("detail", { filename:fileName, content: data });
      }
    });
  });


  //Routes for advanced functions
app.post("/upload",upload,uploadFile);
app.get("/search",searchFile);
app.post("/compressFile",compressedFile);
app.post("/decompressFile",deCompressedFile);
app.post("/encrypt",encryptData);
app.post("/decrypt",decryptData);
app.get("/displayUploadedFiles", async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, "./uploads");
        const filesList = await fs.promises.readdir(uploadDir);
        res.render("uploadedFiles", { filesList });
    } catch (error) {
        console.log("Error getting list of files", error);
        res.status(500).send({ message: "Failed to list files", error: error.message });
    }
});

app.get("/listOfFiles",getListFiles);
app.get("/listOfFiles/:fileName", downloadFile);

app.listen(3000, () => {
  console.log("server listening on port 3000");
});
