//jshint esversion:6

//creating constants and requiring modules
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

// //creating const for button animation
// const ANIMATEDCLASSNAME = "animated";
// const ELEMENTS = document.querySelectorAll(".hover");
// const ELEMENTS_SPAN = [];

//creating a new app instance using express
const app = express();


app.use(express.static("public"));
//use ejs a templating engine
app.set('view engine', 'ejs');

//use body parser to pass request
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "little secert.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://@tellyourlies.bz5jh.mongodb.net/lies", {user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

// If database connection errors
    mongoose.connection.on('error', (err) => {
      console.log('Database error: ' + err);
      //winston.error('Failed to connect to database)
    });

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  lie: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://tellyourlies.herokuapp.com/auth/google/lies"
  },
  function(accessToken, refreshToken, profile, cb) {
console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//use public directory to storestatic files, css etc.
app.use(express.static("public"));

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/lies",
  passport.authenticate("google", {failureRedirect: "login"}),
  function(req, res) {
    //successful authentication, redirect home.
    res.redirect("/lies");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/lies", function(req, res){
  //look through database for field that have value
  User.find({"lie": {$ne: null}}, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if (foundUser) {
        res.render("lies", {usersWithLies: foundUser});
      }
    }
  });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedLie = req.body.lie;

User.findById(req.user.id, function(err, foundUser){
  if (err){
    console.log(err);
  } else {
    if (foundUser) {
      foundUser.lie = submittedLie;
      foundUser.save(function(){
        res.redirect("/lies");
      });
    }
  }
});
  console.log(req.user.id)
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/lies");
      });
    }
  });
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/lies");
      });
    }
  });
});

// //button animation
// ELEMENTS.forEach((element, index) => {
//   let addAnimation = false;
//   if (element.classlist[1] == "flash") {
//     element.addEventListener("animationend", e => {
//       element.classList.remove(ANIMATEDCLASSNAME);
//     });
//     addAnimation = true;
//   }
//   if (!ELEMENTS_SPAN[index]) {
//     ELEMENTS_SPAN[index] = element.querySelector("span");
//   }
// });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started.");
});
