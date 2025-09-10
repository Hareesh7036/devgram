const userAuth = (req, res, next) => {
  const token = "xyz";
  const isAuthorized = token === "yz";
  if (isAuthorized) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

const adminAuth = (req, res, next) => {
  const token = "abc";
  const isAuthorized = token === "abc"; //dummy check
  if (isAuthorized) {
    next();
  } else {
    res.status(401).send("Unauthorized - Admins only");
  }
};

module.exports = { userAuth, adminAuth };
