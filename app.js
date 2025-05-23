const express = require("express");
require('dotenv').config();
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require('./models/User');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { error } = require("console");

// Configure Cloudinary
cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret,
});

// Connect to MongoDB
mongoose.connect(process.env.mongo_url)
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => console.log('Error connecting to MongoDB: ', err));;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

const store = MongoStore.create({
  mongoUrl:process.env.mongo_url,
  crypto:{
    secret: process.env.secret,
  },
  touchAfter: 24*3600
})

store.on("error", ()=>{
  console.log("error in connecting mongo session store",error)
})

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now() + 3*24*60*60*1000,
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
  }
}

const Upload = {
  uploadFile: async (filePath) => {
    try {
      const result = await cloudinary.uploader.upload(filePath);
      return result; // Return the upload result
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  },
};
const methodOverride = require('method-override');

app.use(methodOverride('_method')); 
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.currUser = req.user;
    next();
});

const {isLoggedIn,saveRedirectUrl,isAdmin,ensureAuthenticated} = require('./middlewares/login.js');

const userrouter = require("./routes/user.js");
const otprouter = require("./routes/otp.js");
const blogrouter = require("./routes/blogs.js");
const teamrouter = require("./routes/team.js");
const competitionrouter = require("./routes/competition.js");
const organisorrouter = require("./routes/organisor.js");
const resourcerouter = require("./routes/resource.js");

app.use("/user",userrouter);
app.use("/user",otprouter);
app.use("/",teamrouter);
app.use("/",competitionrouter);
app.use("/",blogrouter);
app.use("/",organisorrouter);
app.use("/",resourcerouter);
// app.use("/",reviewrouter);

app.get("/", async (req,res)=>{
    res.render("index.ejs");
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
