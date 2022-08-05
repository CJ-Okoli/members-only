const express = require('express');
const path = require("path");
const session = require("express-session");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; 
const dotenv = require('dotenv').config();
const ejs = require('ejs');
const port = 3000;
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const postsRouter = require('./routes/posts');
const Posts = require('./models/posts');
const methodOverride = require('method-override');

const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');

// Set up mongoose connection
var dev_db_url = 'mongodb+srv://members:members@cluster0.ohosgom.mongodb.net/?retryWrites=true&w=majority'
var mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
    "User",
    new Schema({
        username: { type: String, required: true },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        password: { type: String, required: true },
        password2: { type: String, required: true }
    })
);

const app = express();
//EJS
// app.use(expressLayouts);
// app.set("views", __dirname);
app.set('view-engine', 'ejs');
//parser
app.use(express.urlencoded({ extended: false })); 

app.use(session({ 
    secret: "cats", 
    resave: false, 
    saveUninitialized: true 
}));

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: "Incorrect username" });

      bcrypt.compare(password, user.password, (err, res) => {
        if (res) return done(null, user);
        return done(null, false, {message:"Incorrect password"})
      })
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'))
app.use('/posts', postsRouter)

// //Routes
// app.use('/', require('./routes/index'));
// app.use('/users', require('./routes/users'));

// const posts =[{
//   title: "test article",
//   createdAt: new Date,
//   description: "Test descrition"
// }, 
// {
//   title: "test article 2",
//   createdAt: new Date,
//   description: "Test descrition 2"
// }]


app.get('/', async (req, res) => {
    const posts = await Posts.find().sort({ createdAt: 'descending' })
    res.render('./posts/index.ejs', { posts: posts });
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard.ejs', {user: req.user});
});

app.get('/message', (req, res) => {
    res.render('message.ejs');
});

app.get('/log-in', (req, res) => {
    res.render('log-in.ejs');
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/register"
  })
);

app.get("/log-out", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', (req, res, next) => {
    //check passwords match
    console.log(req.body.password)
    console.log(req.body.password2)
    if (req.body.password === req.body.password2) {
        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
            // if err, do something
            // otherwise, store hashedPassword in DB
            const user = new User({
                // id: Date.now().toString(),
                username: req.body.username,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: hashedPassword,
                password2: req.body.password2
            }).save(err => {
                if (err) {
                    return next(err);
                }
                res.redirect('/log-in')
            })  
        });
    } else {
        res.redirect('/register')
        return next(errors.push({ message: "Passwords don't match" }));
    }
})

app.listen(port, () => {console.log(`Listening at port ${port}!`)})