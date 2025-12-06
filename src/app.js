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
const connectionRequestRouter = require("./routers/request");
const userRouter = require("./routers/user");
const cors = require("cors");
const paymentRouter = require("./routers/payment");
require("dotenv").config();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "https://devgram-theta.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
//cron job for sending emails, currently disabled
// require("./utils/cronJob");

app.use("/", authRouter);

app.use("/", profileRouter);

app.use("/", connectionRequestRouter);

app.use("/", userRouter);

app.use("/", paymentRouter);

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
