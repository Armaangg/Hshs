const express = require("express");
const request = require("request");
const app = express();

const TARGET = "http://paradise-rewards.ddns.net:6259";

app.use("/", (req, res) => {
  const targetUrl = TARGET + req.url;
  console.log("[Proxy] " + req.method + " → " + targetUrl);

  const proxyReq = request({
    url: targetUrl,
    method: req.method,
    headers: req.headers,
    followRedirect: false, // Handle redirects ourselves
    encoding: null,        // Keep binary safe
  });

  proxyReq.on("response", (proxyRes) => {
    const { statusCode, headers } = proxyRes;

    // Handle 3xx redirects manually
    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      const location = headers.location;

      console.log(`[Redirect] ${statusCode} → ${location}`);
      // Send redirect to browser as-is (e.g., discord.com)
      return res.redirect(statusCode, location);
    }

    // Forward all other headers (exclude problematic ones)
    res.status(statusCode);
    Object.entries(headers).forEach(([key, value]) => {
      if (!["transfer-encoding", "content-length"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.status(500).send("Proxy Error: " + err.message);
  });

  // Pipe body if present (POST, etc.)
  req.pipe(proxyReq);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Reverse proxy running at http://localhost:" + PORT);
});
