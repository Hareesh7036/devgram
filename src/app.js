const express = require("express");
const { adminAuth, userAuth } = require("./middlewares/auth");
const app = express();
const connectDB = require("./config/database");

app.use(express.json());

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
