const express = require('express');
const mongoose = require('mongoose');
const Competition = require('../models/Competition');
const Team = require('../models/Team');
const Participant = require('../models/Participant');

const router = express.Router();

// Route to get all competitions posted by the logged-in user
router.get('/my-competitions', async (req, res) => {
  try {
    const competitions = await Competition.find({ createdBy: req.user._id })
      .populate('createdBy', 'name')
      .exec();

    res.render('organiser/myCompetition.ejs', { competitions });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Route to get teams for a particular competition
router.get('/organisor/competition/:id', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('createdBy', 'name')
      .exec();

    if (!competition) {
      return res.status(404).send('Competition not found');
    }
    
    // Get all teams for this competition
    const teams = await Team.find({ competition: req.params.id })
      .populate('leader', 'name email collegeName department course phoneNumber role') // Populate leader's info
      .populate('members','name email collegeName department course phoneNumber role') // Populate members' info
      .exec();

    res.render('organiser/thisCompetition.ejs', { competition, teams });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
