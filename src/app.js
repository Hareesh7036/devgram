const express = require("express");
const app = express();
const User = require("./models/user");
const connectDB = require("./config/database");

app.use(express.json());

app.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password, age } = req.body;

  // instance of the user model
  const user = new User({
    firstName,
    lastName,
    emailId,
    password,
    age,
  });
  try {
    await user.save();
    res.send("User signed up successfully");
  } catch (err) {
    console.error("Error saving user:", err);
    res.status(500).send("Error saving user");
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
