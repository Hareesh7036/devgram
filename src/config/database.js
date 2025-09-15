require("dotenv").config();
const DB_URI = process.env.DB_URI;
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(`${DB_URI}`);
};

module.exports = connectDB;
