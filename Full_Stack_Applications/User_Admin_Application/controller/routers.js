/* Database layer */

const express = require('express');
const router = express.Router();
const User = require('../models/users'); //importing the model i.e. schema
const multer = require('multer'); //for uploading files
const fs = require('fs');
const { log } = require('console');


//storing files locally by passing a function defining the directory
var storage = multer.diskStorage({
    destination: (req,file, cb)=>{
        cb(null, './uploads')
    },
    filename:(req,file, cb)=>{
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    }
});

//upload middleware, use single as we're uploading one image a time
var upload = multer({storage: storage}).single('image') //'image' is the name of the image input

//adding a user
router.get('/add', (req,res)=>{
    res.render("add_user",{
        title:"Add User"
    })
})
//inserting a user into database route
router.post('/add', upload, async(req, res)=>{
   try{

    const userSaved = await User.create({
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        image:req.file.filename
    })
    console.log("User saved successfully", userSaved)
    req.session.message = {
        message:"user added succesfully",
        type:'success'
    }
    res.redirect('/');

   }catch(err){

    res.status(400).json({
        message: err.message,
        type:"danger"
    })
    console.log("error saving user: ", err);
    res.redirect('/');
   }

})

//getting all users 
router.get('/', async(req,res)=>{

    try{
        const users = await User.find({}).exec();
         res.render('home_view', {
                title: "Home Page",
                users: users
            });
    }catch(err){
        res.json({ message : err.message })
    }
 })

//get the edit user page 
router.get('/edit/:id',  async(req,res)=>{
    let id= req.params.id;
    
    try{
        const user = await User.findById(id)
        res.render("edit_user", {
                                title: "Edit user",
                                user: user
                                 })  
    }catch(err){
        res.redirect('/');
        console.log("failed to fetch user data", err);
    }
})

//update user
router.post('/update/:id', upload, async(req, res)=>{
    let id= req.params.id;
    let new_image="";

    //if a file was selected 
    if(req.file){
        new_image=req.file.fieldname
        try{
            //removing the old image with the new one
            fs.unlinkSync('./uploads/'+ req.body.old_image)
        }catch(err){
            console.log(err);
        }
    }else{
        new_image = req.body.old_image
    }
    
    //update user details
    try{
           const userUpdated = await User.findByIdAndUpdate(id,{
                    name:req.body.name,
                    email:req.body.email,
                    phone:req.body.phone,
                    image:req.body.image
                });

                req.session.message = {
                    message:"User updated succesfully",
                    type:"success"
                }
                res.redirect('/')
    }catch(err){
        res.json({
            message:err.message,
            type:"danger"
        })
        console.log("failed to update user: ", err);
    }
})

//getting user to delete
router.get('/delete/:id', async(req, res)=>{
    let id = req.params.id;
    
    try{
        const userDeleted = await User.findByIdAndDelete(id);

        if(userDeleted.image != ''){
            try{
                fs.unlinkSync('./uploads/' + userDeleted.image)
            }catch(err){
                console.log(err)
            }
        }
        req.session.message={
                message: "User deleted succesfully",
                type:'info'
            }
        res.redirect('/')

    }catch(err){

        res.json({ message: err.message })
        res.redirect('/')
    }
})

module.exports = router;