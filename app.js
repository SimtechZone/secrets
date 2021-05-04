//  Calling all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// initializing app
const app = express();

// Setting template engine
app.set('view engine', 'ejs');

// setting static folder, bodyparser, session, passport initialize and session
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "Loveisthedeathofduty",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Connection to the database
mongoose.connect("mongodb://localhost:27017/userDB",{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

// Schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Adding plugin to Schema to use passportLocalMongoose
userSchema.plugin(passportLocalMongoose);

// Collection models
const User = new mongoose.model("User", userSchema);

// Configuring passport/passport-Local
passport.use(User.createStrategy());

// To pack data into cookie using serializeUser and unpack using deserializeUser
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

// Get request to secrets route
app.get("/secrets", function(req, res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }
});

// Get request to logout route
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

// Post request from registeration route
app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

// Post requets from login route
app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

// Setting Server port
app.listen(3000, function(){
  console.log("Server started on port 3000");
});
