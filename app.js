//  Calling all the modules
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  password: String,
  googleId: String,
  secret: String
});

// Adding plugin to Schema to use passportLocalMongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Collection models
const User = new mongoose.model("User", userSchema);

// Configuring passport/passport-Local
passport.use(User.createStrategy());

// To pack data into cookie using serializeUser and unpack using deserializeUser
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Using OAuth to authorize clients via google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Get request to Home route
app.get("/", function(req, res){
  res.render("home");
});

// Get request to google to authenticate the user
app.get("/auth/google",
  passport.authenticate('google', {scope: ["profile"]})
);

// route that google will send the data to
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
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
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    }
    else{
      if(foundUsers){
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

// Get request to logout route
app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

// Get request to the submit route
app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
});

//
app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;
  User.findById(req.user.id, function(err, user){
    if(err){
      console.log(err);
    }
    else{
      if(user){
        user.secret = submittedSecret;
        user.save(function(err){
          res.redirect("/secrets");
        });
      }
    }
  });
});

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
