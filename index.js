const express = require("express");
const request = require("request");
const app = express();

const TARGET = "http://paradise-rewards.ddns.net:6259";

app.use("/", (req, res) => {
  const targetUrl = TARGET + req.url;
  console.log("Proxying to:", targetUrl);
  req.pipe(request(targetUrl))
    .on("error", err => {
      res.status(500).send("Proxy Error: " + err.message);
    })
    .pipe(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Reverse proxy running at http://localhost:" + PORT);
});
