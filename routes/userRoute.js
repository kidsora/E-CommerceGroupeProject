const express = require("express");
const user_route = express();


const userController = require("../controllers/userController")

const bodyParser = require("body-parser")
user_route.use(bodyParser.json())
user_route.use(bodyParser.urlencoded({extended:true}))

const multer = require("multer")
const path = require("path")
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, path.join(__dirname, "../public/userImages"));
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name)
    }
})
const upload = multer({storage:storage})


user_route.get("/register", userController.loadRegister)

user_route.post("/register" ,upload.single("image"),userController.insertUser)

user_route.get("/verify", userController.verifyMail);

user_route.post("/login",userController.loginUser);


module.exports = user_route