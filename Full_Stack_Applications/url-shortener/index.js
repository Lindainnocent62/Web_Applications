require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const validUrl = require("valid-url");
const bodyParser = require("body-parser");


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

//needed when working with POST requests
app.use(bodyParser.json()); // for parsing json data
app.use(bodyParser.urlencoded({ extended: true })); // parsing urlencoded form data

//because we are not using a database, we will use a simple object to store the url and the shorturl
const originalUrls =[];
const shortUrls =[];

//Post API call
app.post("/api/shorturl", (req, res)=>{
  //url
  const url =req.body.url;
  const urlIndex=originalUrls.indexOf(url);

if(!validUrl.isWebUri(url)){
  return res.json({error: "invalid url"});

} else if(urlIndex<0){//searching if the url is found in the db in this case its an array
  originalUrls.push(url);
  shortUrls.push(shortUrls.length)
  
  return res.json({
    original_url:url,
    short_url:shortUrls.length - 1
  })
}
else{
  return res.json({
    original_url:url,
    short_url:shortUrls[urlIndex]
  })
 }  
});

//handling the get request for the shorturl
app.get("/api/shorturl/:shorturl",(req,res)=>{
  const short_Url = parseInt(req.params.shorturl);
  const urlIndex = shortUrls.indexOf(short_Url);

  //check if index found
  if(urlIndex<0){
    return res.json({error: "Short Url not found!"});
  }else{
    return res.redirect(originalUrls[urlIndex]);
  }
})


app.listen(port, function () {
  console.log(`Listening on port http://localhost:${port}`);
})
//restarting server after installing nodemon use: 'rs' meaning restart server