const express = require("express");
const { adminAuth, userAuth } = require("./middlewares/auth");
const app = express();
const User = require("./models/user");
const connectDB = require("./config/database");

app.use(express.json());

app.post("/signup", async (req, res) => {
  const user = new User({
    firstName: "Hari",
    lastName: "Avvari",
    emailId: "hari@gmail.com",
    password: "Hari@123",
    age: 27,
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
