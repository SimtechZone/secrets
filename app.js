//  Calling all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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

// Encryption process
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

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
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
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

// Post requets from login route
app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email: username}, function(err, user){
    if(err){
      console.log(err);
    }
    else{
      if(user){
        if(user.password === password){
          res.render("secrets");
        }
      }
    }
  });
});

// Setting hosting port
app.listen(3000, function(){
  console.log("Server started on port 3000");
});
