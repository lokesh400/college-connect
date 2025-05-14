const express = require("express");
const router = express.Router();
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator'); 
require('dotenv').config();

const Otp = require('../models/Otp');

const {
    isLoggedIn,
    saveRedirectUrl,
    isAdmin,
    ensureAuthenticated,
  } = require("../middlewares/login.js");

const Blog = require("../models/Blog.js");

// // Render blog editor
// router.get('/create', (req, res) => {
//   res.render('editor');
// });

// Handle blog submission
router.post('/create', async (req, res) => {
   try {
    const { title, content, authorId } = req.body;

    // Check if the author exists
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(404).send('Author not found');
    }

    // Create the new blog
    const newBlog = new Blog({
      title,
      content,
      author: authorId,
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    res.status(500).send('Error creating blog');
  }
});

// List blogs
// router.get('/', async (req, res) => {
//   const blogs = await Blog.find().sort({ createdAt: -1 });
//   res.render('blogList', { blogs });
// });

// View a single blog
// router.get('/:id', async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   res.render('viewBlog', { blog });
// });



  //All Blogs
  router.get('/show/all/blogs', async (req,res)=>{
    const blogs = await Blog.find()
    .populate('author','name email');
    res.render('student/allBlogs.ejs',{blogs});
  })

  //This Blog
  router.get('/show/this/blog/:id', async (req,res)=>{
    const blog = await Blog.findById(req.params.id);
    res.render('student/thisBlog.ejs',{blog});
  })

  //new blog
  router.get('/add/new/blog',saveRedirectUrl,isLoggedIn, async(req,res)=>{
    res.render('student/newBlog.ejs');
  })

  router.post('/add/new/blog',saveRedirectUrl,isLoggedIn, async (req, res) => {
    try {
      const user = req.user.id;
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ status: 'error', message: 'Title and content are required.' });
      }
      const newBlog = new Blog({ title, content,author:user });
      await newBlog.save();
      res.status(201).json({ status: 'ok', message: 'Blog added successfully', blog: newBlog });
    } catch (error) {
      console.error('Error adding blog:', error);
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  });
  

module.exports = router;