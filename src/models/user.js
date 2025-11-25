const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: true,
      maxLength: 20,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return validator.isEmail(email);
        },
        message: "is not a valid email!",
      },
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: function (password) {
          return validator.isStrongPassword(password);
        },
        message: "is not a strong password!",
      },
    },
    age: {
      type: Number,
      min: 18,
      default: 18,
    },
    gender: {
      type: String,
      validate: {
        validator: function (gender) {
          if (!["male", "female", "other"].includes(gender)) {
            throw new Error("This is not a valid gender");
          }
        },
      },
    },
    about: {
      type: String,
      maxLength: 250,
    },
    skills: {
      type: [String],
    },
    photoUrl: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80",
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (password) {
  const user = this;
  const passwordHash = user.password;
  return await bcrypt.compare(password, passwordHash);
};

module.exports = mongoose.model("User", userSchema, "users");
