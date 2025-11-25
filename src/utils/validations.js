const bcrypt = require("bcrypt");
const validator = require("validator");

function validateSignupData(data) {
  const { firstName, lastName, skills, password } = data;
  if (!firstName || !lastName || !password) {
    throw new Error("First name and last name are required");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not strong enough");
  } else if (skills?.length > 10) {
    return res.status(400).send("Skills cannot be more than 10");
  } else {
    let areSkillsNotValid = skills?.some((skill) => skill.length > 15);
    if (areSkillsNotValid) {
      return res
        .status(400)
        .send("Each skill cannot be more than 15 characters");
    }
  }
}

function validateEditProfileData(data) {
  const allowedFields = [
    "firstName",
    "lastName",
    "age",
    "gender",
    "about",
    "skills",
    "photoUrl",
  ];
  const dataFields = Object.keys(data);
  const isValidOperation = dataFields.every((field) =>
    allowedFields.includes(field)
  );
  if (!isValidOperation) {
    return false;
  }
  if (dataFields["skills"]?.length > 10) {
    return res.status(400).send("Skills cannot be more than 10");
  } else {
    let areSkillsNotValid = data.skills?.some((skill) => skill.length > 15);
    if (areSkillsNotValid) {
      return res
        .status(400)
        .send("Each skill cannot be more than 15 characters");
    }
  }
  return true;
}

async function getHashedPassword(password) {
  return await bcrypt.hash(password, 10);
}

module.exports = {
  validateSignupData,
  validateEditProfileData,
  getHashedPassword,
};
