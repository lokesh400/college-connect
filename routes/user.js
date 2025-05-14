const express = require("express");
const router = express.Router();
const User = require("../models/User");
const TeamPost = require("../models/TeamPost");
const Application = require("../models/Application.js");
const passport = require("passport");
const nodemailer = require("nodemailer");
const passportLocalMongoose = require("passport-local-mongoose");
const Otp = require("../models/Otp");
const NewsLetter = require("../models/NewsLetter.js");
const {
  isLoggedIn,
  saveRedirectUrl,
  isAdmin,
  ensureAuthenticated,
} = require("../middlewares/login.js");

// Signup route
router.get("/signup", (req, res) => {
  req.flash("error_msg", "Hello Dear");
  res.render("./users/signup.ejs");
});

router.post("/signup", async (req, res) => {
  const { name, email, password, confirmpassword, otp, contactNumber } =
    req.body;
  const role = "customer";
  const username = email;
  let user = await Otp.findOne({ email });
  if (password == confirmpassword && otp == user.otp) {
    const newUser = new User({ name, role, email, username, contactNumber });
    try {
      const registeredUser = await User.register(newUser, password);
      const newSubscriber = new NewsLetter({ email });
      await newSubscriber.save();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        secure: false,
        port: 587,
        auth: {
          user: "official.keshvibe@gmail.com",
          pass: process.env.mailpass,
        },
      });

      try {
        const mailOptions = await transporter.sendMail({
          from: "official.keshvibe@gmail.com",
          to: `${email}`,
          subject: "Welcome to keshvibe.in",
          html: `
                <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to KeshVibe</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }

        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
        }

        .header p {
            margin: 5px 0 0;
            font-size: 16px;
        }

        .body {
            padding: 20px;
        }

        .body h2 {
            color: #1e3a8a;
            margin-bottom: 10px;
        }

        .body p {
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
        }

        .cta-button {
            display: block;
            width: 200px;
            margin: 20px auto;
            text-align: center;
            padding: 15px 20px;
            background-color: #1e3a8a;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
        }

        .cta-button:hover {
            background-color: #162c5b;
        }

        .footer {
            text-align: center;
            padding: 10px 20px;
            background-color: #f1f1f1;
            font-size: 14px;
            color: #666666;
        }

        .footer a {
            color: #1e3a8a;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>Welcome to KeshVibe!</h1>
            <p>Your journey with exclusive fashion starts here.</p>
        </div>

        <!-- Body -->
        <div class="body">
            <h2>Hi ${name} ,</h2>
            <p>Thank you for signing up with KeshVibe! We're thrilled to have you on board. Explore the latest trends, exclusive collections, and more, all tailored to elevate your style.</p>
            <p>As a member, you’ll be the first to know about:</p>
            <ul>
                <li>New arrivals and collections</li>
                <li>Exclusive offers and discounts</li>
                <li>Fashion inspiration and styling tips</li>
            </ul>
            <p>Ready to shop? Click the button below to start your journey with KeshVibe:</p>
            <a href="https://keshvibe.in" class="cta-button">Shop Now</a>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>&copy; 2025 KeshVibe. All rights reserved.</p>
        </div>
    </div>
</body>

</html>
`,
        });
      } catch (error) {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log(info + response);
          }
        });
      }
      // Redirect to login page after successful registration
      res.redirect("/user/login");
    } catch (error) {
      console.error(error);
      // Render signup page with an error message
      req.flash("error_msg", error.message);
      res.render("./users/signup.ejs");
    }
  } else {
    res.render("./users/signup.ejs", { error: "password do not match" });
  }
});

// Login route
router.get("/login", (req, res) => {
  if ( req.user && req.user.role==='admin') {
    res.redirect("/user/my-dash");
  }
  else if( req.user && req.user.role==='customer'){
    res.redirect("/");
  }
  else{
    req.flash("error_msg", "Welcome back");
  res.render("./users/login.ejs");
  }
});

router.post("/login", saveRedirectUrl, (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      req.flash("error_msg", "Something went wrong. Please try again.");
      return res.redirect("/user/login");
    }
    if (!user) {
      req.flash("error_msg", info.message || "Invalid credentials.");
      return res.redirect("/user/login");
    }
    req.login(user, (err) => {
      if (err) {
        console.error("Login failed:", err);
        req.flash("error_msg", "Login failed. Please try again.");
        return res.redirect("/user/login");
      }
      req.flash("success_msg", "Successfully logged in!");
      res.redirect(res.locals.RedirectUrl || "/my-dash");
    });
  })(req, res, next);
});

router.get("/my-dash", async(req,res)=>{
    // const cars = await Car.find({});
    res.render("student/myDashboard.ejs")
})

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/"); // Redirect to homepage after logout
  });
});

//my-postings

router.get('/show/my/postings', async (req, res) => {
  const posts = await TeamPost.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
  res.render('student/myPostings', { posts });
});

// Route to view applications for a specific post
router.get('/post/:id/applications', async (req, res) => {
  const applications = await Application.find({ post: req.params.id })
    .populate('applicant')
    .sort({ appliedAt: -1 });

  res.render('student/postApplications', { applications });
});

module.exports = router;
