const mongoose = require("mongoose");
const validator = require("validator");

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
    skills: {
      type: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema, "users");
