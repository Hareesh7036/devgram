const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.get(
  "/demo",
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
  (req, res, next) => {
    console.log("third response");
    // res.send("Hello,demo World! second response");
    next();
  },
  (req, res, next) => {
    console.log("final response");
    res.send("Hello,demo World! final response");
    // we will get cannot get /demo if we uncomment next() here
    // next();
  }
);

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

app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
