const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../helpers/emailHelper");

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");
  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) {
    res
      .status(500)
      .json({ message: "The user with given id is not found", success: false });
  }
  res.status(200).send(user);
});

router.post("/register", async (req, res) => {
  // Check if the email is already registered
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res
      .status(200)
      .json({ message: "User already has an account", success: false });
  }

  // Create a new user if email doesn't exist
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.passwordHash, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
  });

  user = await user.save();

  if (!user) {
    return res.status(500).send("The user cannot be created");
  }

  // Send a registration confirmation email
  try {
    await sendEmail(
      user.email,
      "Account Created Successfully",
      `Hello ${user.name},\n\nYour account has been created successfully!\n\nThank you for joining us.\n\nBest regards,\nYour Company`
    );
    console.log("Registration email sent");
  } catch (error) {
    console.error("Failed to send registration email:", error);
  }

  res.status(200).send({
    success: true,
    message: "User registered successfully check your email for confirmation",
    user: user,
  });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const secret = process.env.secret;

  if (!user) {
    return res
      .status(200)
      .send({ success: false, message: "the User not found" });
  }
  if (user && bcrypt.compareSync(req.body.passwordHash, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      secret,
      {
        expiresIn: "1d",
      }
    );

    return res
      .status(200)
      .send({ email: user.email, token: token, id: user.id });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Password" });
  }
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "the user not found" });
      }
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/count", async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    return res.status(500).json({ success: false });
  }
  return res.send({
    userCount: userCount,
  });
});

module.exports = router;
