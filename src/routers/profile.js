const express = require("express");
const { useAuth } = require("../middlewares/auth");
const {
  validateEditProfileData,
  getHashedPassword,
} = require("../utils/validations");
const validator = require("validator");

const profileRouter = express.Router();

profileRouter.get("/profile/view", useAuth, async (req, res) => {
  try {
    res.send(req.user);
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
});

profileRouter.patch("/profile/edit", useAuth, async (req, res) => {
  try {
    const isValidEdits = validateEditProfileData(req.body);
    if (!isValidEdits) {
      return res.status(400).send("Invalid updates!");
    }
    const loggedInUser = req.user;
    const updates = Object.keys(req.body);
    updates.forEach((update) => {
      loggedInUser[update] = req.body[update];
    });
    await loggedInUser.save();
    res.send(loggedInUser);
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
});

profileRouter.patch("/profile/password", useAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).send("Both old and new passwords are required");
    }
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .send("New password must be different from old password");
    }
    const isPasswordValid = await req.user.validatePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).send("Old password is incorrect");
    }
    if (!validator.isStrongPassword(newPassword)) {
      return res.status(400).send("New password is not strong enough");
    }
    const hashedPassword = await getHashedPassword(newPassword);
    const loggedInUser = req.user;
    loggedInUser.password = hashedPassword;
    await loggedInUser.save();
    res.send("Password updated successfully");
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
});

module.exports = profileRouter;
