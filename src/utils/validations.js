function validateSignupData(data) {
  const { firstName, lastName, skills } = data;
  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
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

module.exports = { validateSignupData };
