const express = require("express");
const app = express();
const User = require("./models/user");
const connectDB = require("./config/database");
const { validateSignupData } = require("./utils/validations");
const bcrypt = require("bcrypt");

app.use(express.json());

app.post("/signup", async (req, res) => {
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

app.post("/login", async (req, res) => {
  const { emailId, password } = req.body;
  try {
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send("Invalid password");
    } else {
      res.send("Login successful");
    }
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});
// get user by email id..
app.get("/user", async (req, res) => {
  const userEmail = req.body.emailId;
  try {
    const user = await User.findOne({ emailId: userEmail });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.send(user);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.get("/feed", async (req, res) => {
  try {
    const feed = await User.find({});
    res.send(feed);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.id;
  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User deleted successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.patch("/user", async (req, res) => {
  const userId = req.body.id;
  const newAge = req.body.age;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      { _id: userId },
      { age: newAge }
    );
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});
// update user by email id
app.patch("/userbyemail", async (req, res) => {
  const email = req.body.emailId;
  const newAge = req.body.age;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { emailId: email },
      { age: newAge }
    );
    if (!updatedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

connectDB()
  .then(() => {
    console.log("Database connected!!");
    app.listen(8080, () => {
      console.log("Server is running on http://localhost:8080");
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
