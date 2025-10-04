const express = require("express");
const app = express();
const User = require("./models/user");
const connectDB = require("./config/database");
const { validateSignupData } = require("./utils/validations");

const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { useAuth } = require("./middlewares/auth");
const authRouter = require("./routers/auth");
const profileRouter = require("./routers/profile");

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);

app.use("/", profileRouter);

app.get("/feed", useAuth, async (req, res) => {
  try {
    const feed = await User.find({});
    res.send(feed);
  } catch (err) {
    res.status(400).send("something went wrong");
  }
});

app.delete("/user", useAuth, async (req, res) => {
  try {
    const userId = req.body.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).send("User not found");
    }
    res.send("User deleted successfully");
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
