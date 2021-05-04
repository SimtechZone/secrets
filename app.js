//  Calling all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");

// Salting for bcrypt hashing
const saltRounds = 10;

// initializing app
const app = express();

// Setting template engine
app.set('view engine', 'ejs');

// setting static folder and bodyparser
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Connection to the database
mongoose.connect("mongodb://localhost:27017/userDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Encryption process using mongoose-encrypt
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

// Collection models
const User = new mongoose.model("User", userSchema);

// Get request to Home route
app.get("/", function(req, res){
  res.render("home");
});

// Get request to login route
app.get("/login", function(req, res){
  res.render("login");
});

// Get request to register route
app.get("/register", function(req, res){
  res.render("register");
});

// Post request from register route
app.post("/register", function(req, res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      // password: md5(req.body.password)
      password: hash
    });
    newUser.save(function(err){
      if(err){
        console.log(err);
      }
      else{
        res.render("secrets");
      }
    });
  });
});

// Post requets from login route
app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  // const password = md5(req.body.password);
  User.findOne({email: username}, function(err, user){
    if(err){
      console.log(err);
    }
    else{
      if(user){
        bcrypt.compare(password, user.password, function(err, result) {
          if(result === true){
            res.render("secrets");
          }
        });
      }
    }
  });
});

// Setting hosting port
app.listen(3000, function(){
  console.log("Server started on port 3000");
});
