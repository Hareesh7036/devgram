const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/test", (req, res) => {
  const { body } = req;
  const { sample } = body;
  console.log("request type", req.method);
  res.send(`sample text length is: ${sample.length}`);
});

app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
