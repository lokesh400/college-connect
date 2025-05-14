const express = require('express');
const router = express.Router();
const TeamPost = require('../models/TeamPost');
const Application = require('../models/Application');
const User = require('../models/User');

const {
  isLoggedIn,
  saveRedirectUrl,
  isAdmin,
  ensureAuthenticated,
} = require("../middlewares/login.js");

// Home - List all posts
router.get('/all/posts', async (req, res) => {
  const posts = await TeamPost.find().populate('createdBy');
  res.render('allPost.ejs', { posts });
});

// New post form
router.get('/new/post',saveRedirectUrl,isLoggedIn, (req, res) => {
  res.render('newPost.ejs');
});

// Create new post
router.post('/posts',saveRedirectUrl,isLoggedIn, async (req, res) => {
  const { title, description, skillsNeeded } = req.body;
  await TeamPost.create({
    title,
    description,
    skillsNeeded: skillsNeeded.split(',').map(s => s.trim()),
    createdBy: req.user._id
  });
  res.redirect('/all/posts');
});

// View a single post and apply
router.get('/posts/:id',saveRedirectUrl,isLoggedIn, async (req, res) => {
  const post = await TeamPost.findById(req.params.id).populate('createdBy');
  const applications = await Application.find({ post: post._id }).populate('applicant');
  res.render('thisPost.ejs', { post, applications });
});

// Apply to a post
router.post('/posts/:id/apply',saveRedirectUrl,isLoggedIn, async (req, res) => {
  const { message } = req.body;
  await Application.create({
    post: req.params.id,
    applicant: req.user._id,
    message
  });
  res.redirect(`/posts/${req.params.id}`);
});

module.exports = router;
