const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
require("dotenv").config();

const {
  isLoggedIn,
  saveRedirectUrl,
  isAdmin,
  ensureAuthenticated,
} = require("../middlewares/login.js");

const Competition = require("../models/Competition");
const Prize = require("../models/Prize");
const Team = require("../models/Team");
const Participant = require("../models/Participant");

router.get("/competitions", async (req, res) => {
  try {
    const competitions = await Competition.find().populate("prizes");
    res.render("student/allCompetitions", { competitions });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching competitions");
  }
});

// Display competition form
router.get("/competition/create",saveRedirectUrl,isLoggedIn, (req, res) => {
  res.render("student/createCompetition");
});

// Create new competition
router.post("/competition",saveRedirectUrl,isLoggedIn, async (req, res) => {
  const { title, description, minMembers, maxMembers, teamSize } = req.body;
  const competition = new Competition({
    title,
    description,
    minMembers,
    maxMembers,
    teamSize,
    createdBy: req.user.id
  });
  await competition.save();
  res.redirect(`/competition/${competition._id}`);
});

// Display competition details and prizes
router.get("/competition/:id", async (req, res) => {
  const competition = await Competition.findById(req.params.id).populate(
    "prizes"
  );
  res.render("student/competitionDetails", { competition });
});

// Add prize to competition
router.post("/competition/:id/prize",saveRedirectUrl,isLoggedIn, async (req, res) => {
  const { title, description, amount, type } = req.body;
  const prize = new Prize({
    competition: req.params.id,
    title,
    description,
    amount,
    type,
  });
  await prize.save();

  const competition = await Competition.findById(req.params.id);
  competition.prizes.push(prize);
  await competition.save();

  res.redirect(`/competition/${req.params.id}`);
});

// Apply to a team
router.get("/create/team/apply/:id",saveRedirectUrl,isLoggedIn, async (req, res) => {
  res.render("student/applyCompetition.ejs", { id: req.params.id });
});


router.post("/register/competition/team/:id", saveRedirectUrl, isLoggedIn, async (req, res) => {
  const {
    name,
    teamName,
    collegeName,
    teamSize,
    course,
    department,
    email,
    phoneNumber,
  } = req.body;

  // Convert teamSize to Number
  const teamSizeNum = Number(teamSize);

  // Check if team with the same name exists for this competition
  const existingTeam = await Team.findOne({ competition: req.params.id, teamName: teamName });
  if (existingTeam) {
    return res.send("Team name already taken.");
  }

  // Check if participant is already registered in the competition
  const alreadyParticipant = await Participant.findOne({ competition: req.params.id, email: email });
  if (alreadyParticipant) {
    return res.send("Already registered for the competition.");
  }

  // Create the new participant (leader)
  const participant = new Participant({
    name,
    teamName,
    collegeName,
    course,
    department,
    email,
    phoneNumber,
    competition: req.params.id,
    role: "Leader",
  });

  await participant.save();

  // After saving the participant, get the participant's id
  const leaderId = participant._id;

  // Create the new team
  const newTeam = new Team({
    competition: req.params.id,
    teamName,
    teamSize: teamSizeNum,
    leader: leaderId,
    members: [leaderId], // Initially, the leader is the only member
  });

  await newTeam.save();

  // Update the participant with the team they belong to
  participant.team = newTeam._id;
  await participant.save();

  // Redirect or send a response after successful team creation
  res.send("Team successfully registered.");
});

// route to search team and render form
router.post("/search/already/team/apply/:competitionId", saveRedirectUrl, isLoggedIn, async (req, res) => {
  const { teamName } = req.body;
  const competitionId = req.params.competitionId;

  try {
    // Find the team by its name and competition ID
    const team = await Team.findOne({ competition: competitionId, teamName: teamName })
      .populate('leader', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return res.send("Team not found for this competition.");
    }

    // Redirect to registration page to apply to the found team
    return res.render('student/registerTeam', { competitionId, team });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching for team.");
  }
});

// route to apply team
router.post("/apply/team/:competitionId/:teamId", saveRedirectUrl, isLoggedIn, async (req, res) => {
  const { teamId, competitionId } = req.params;
  const {
    name,
    collegeName,
    course,
    department,
    email,
    phoneNumber,
  } = req.body;

  try {
    // Check if the user has already applied to a team in this competition
    const existingParticipant = await Participant.findOne({ competition: competitionId, email: email });
    if (existingParticipant) {
      return res.send("You are already registered for this competition.");
    }

    // Create a new participant
    const participant = new Participant({
      name,
      email,
      phoneNumber,
      collegeName,
      course,
      department,
      competition: competitionId,
      role: "Member",
      teamName: teamId, // Team name to be stored as reference
    });

    await participant.save();

    // Add the participant to the team
    const team = await Team.findById(teamId);
    team.members.push(participant._id); // Add new participant to the team
    await team.save();

    // Send approval request to team leader (You can customize this as per your needs)
    const teamLeader = team.leader;
    // Here, you can send an email or a notification to the team leader to approve or decline the participant
    // For simplicity, we're assuming approval is manual for now.

    res.send("Your application has been submitted to the team leader for approval.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error applying to team.");
  }
});

//leader approval to join team
router.post("/approve/participant/:teamId/:participantId", isLoggedIn, async (req, res) => {
  const { teamId, participantId } = req.params;

  try {
    const team = await Team.findById(teamId);
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not the leader of this team.");
    }

    // Find the participant
    const participant = await Participant.findById(participantId);
    if (!participant) {
      return res.send("Participant not found.");
    }

    // Approve or decline the participant's request
    // You can add a status field in Participant model to track approval (approved: true/false)
    participant.status = req.body.status; // 'approved' or 'declined'
    await participant.save();

    res.send(`Participant has been ${req.body.status === 'approved' ? 'approved' : 'declined'}.`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error handling approval.");
  }
});


module.exports = router;
