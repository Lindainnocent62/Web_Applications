/*CONTROLLER*/
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');


const app = express();
const PORT = process.env.PORT || 3300;

//connecting to database and handling errors in connecting
try{
  mongoose.connect(process.env.MONGODB_URI);
}catch(err){
    console.log("failed to connect to database url:", err)
}

//creating a connection
const db_connection = mongoose.connection;
//handle error after connection is established
db_connection.on('error', (error)=>{
    console.log('database connection lost');
})
//give feedback once database is opened
db_connection.once('open', ()=>{
    console.log("successfully connected to database");
})

//necessary middlewares
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//session
app.use(session({
    secret: "for_now_we_will_only_have_this_string_as_a_secret_string_",
    saveUninitialized: true,
    resave: false
}))
//session storing messages locally
app.use((req, res, next)=>{
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})
//setting up ejs template engine
app.set('view engine', 'ejs');

//route prefix middleware, bringing/importing the routes to the server file
app.use("", require('./controller/routers')) ;

//static middleware for displaying content in the uploads folder
app.use(express.static("uploads"))

app.listen(PORT, ()=>{
    console.log(`Server started at port: http://localhost:${PORT}`)//dont use https as it normally doesnt require a secure connection
})
