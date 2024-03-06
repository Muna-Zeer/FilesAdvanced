const express = require("express");
const app = express();
const fs=require('fs');
const {extname}=require('path');
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.urlencoded({extended:true}))
app.use(express.static("public"));


app.get("/create", (req, res) => {
  res.render("create");
});

app.post("/create", (req, res) => {
    const {fileName,fileContent}=req.body;
  const allowedExtentions=['.js','.txt','.json','.css'];
  const ext=extname(fileName);
  if(!allowedExtentions.includes(ext)){
    res.status(400).send('un supported ext file');
    return;
  }
  const filePath = `./data/${fileName}`;


  fs.writeFile(filePath, fileContent, (err) => {
  if(err){
      console.error("Error creating file", err);
      res.status(500).send("Error while creating file");
      return;
   
}
    console.log("Created file successfully", fileName);
    res.redirect("/");
  
});
});



app.listen(3000, () => {
  console.log("server listening on port 3000");
});
