const express = require("express");
const { validateSignupData } = require("../utils/validations");
const authRouter = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

authRouter.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password, age, skills } = req.body;

  try {
    // validations
    validateSignupData(req.body);
    // password encryption can be done here using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    // instance of the user model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashedPassword,
      age,
      skills,
    });
    // save user to db

    await user.save();
    res.send("User signed up successfully");
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).send("ERROR: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  const { emailId, password } = req.body;
  try {
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    } else {
      const token = await user.getJWT();
      res.cookie("token", token);
      res.send("Login successful");
    }
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
});

module.exports = authRouter;
