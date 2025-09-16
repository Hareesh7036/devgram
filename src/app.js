const express = require("express");
const app = express();
const User = require("./models/user");
const connectDB = require("./config/database");

app.use(express.json());

app.post("/signup", async (req, res) => {
  const { firstName, lastName, emailId, password, age } = req.body;
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
