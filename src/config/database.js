require("dotenv").config();
// const DB_URI = process.env.DB_URI;
const DB_URI =
  "mongodb+srv://madahareesh12:hareesh@cluster0.hk3hq.mongodb.net/devgram?retryWrites=true&w=majority&appName=Cluster0";
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(`${DB_URI}`);
};

module.exports = connectDB;
