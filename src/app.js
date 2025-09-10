const express = require("express");
const { adminAuth, userAuth } = require("./middlewares/auth");
const app = express();

app.use(express.json());

app.use("/admin", adminAuth); //middleware for all admin routes

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.get("/admin/getData", (req, res) => {
  res.send("Hello, getData World!");
});

// here userAuth middleware will only work for /user route
app.get("/user", userAuth, (req, res) => {
  res.send("Hello, user World!");
});

app.get("/user/login", (req, res) => {
  // error handling inside route handler
  try {
    throw new Error("Something went wrong!");
    res.send("Hello, user login World!");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }

  // this is not recommended because it will expose some internal details to user
  //throw new Error("Something went wrong!");
});

app.get("/admin/deleteUser", (req, res) => {
  res.send("Hello, deleteUser World!");
});
app.get(
  "/demo",
  //we can also pass array of route handlers
  [
    (req, res, next) => {
      console.log("first response");
      // res.send("Hello,demo World!");
      next();
    },
    (req, res, next) => {
      console.log("second response");
      // res.send("Hello,demo World! second response");
      next();
    },
  ],
  (req, res, next) => {
    console.log("third response");
    // res.send("Hello,demo World! second response");
    next();
  },
  [
    (req, res, next) => {
      console.log("final response");
      // res.send("Hello,demo World! final response");
      next();
    },
  ]
);
// both are same routes but will execute as per sequence
// first one will execute and then second one
// if we call next() in first one
app.get("/demo", (req, res) => {
  res.send("Hello,demo World! GET request in seperate handler");
});

app.post("/test/:id", (req, res) => {
  const query = req.query;
  const { name } = query;
  const { id } = req.params;
  const { body } = req;
  const { sample } = body;
  console.log("request type", req.method);
  res.send(
    `sample text length is: ${sample.length} and name is: ${name} and id is: ${id}`
  );
});

// error handling middleware for all routes
// app.use("/", (err, req, res, next) => {
//   if (err) {
//     console.error(err.message);
//     res.status(500).send("Something broke!");
//   }
// });

app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
