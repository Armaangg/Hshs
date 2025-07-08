const express = require("express");
const request = require("request");
const app = express();

// 🎯 Your backend
const TARGET = "http://paradise-rewards.ddns.net:6259";

app.use("/", (req, res) => {
  const targetUrl = TARGET + req.url;
  console.log(`[Proxy] ${req.method} → ${targetUrl}`);

  const options = {
    url: targetUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: new URL(TARGET).host
    },
    followRedirect: false, // Let the browser follow redirects
    encoding: null // Important for binary responses
  };

  // Include request body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    options.body = req;
  }

  const proxyReq = request(options);

  proxyReq.on("response", (proxyRes) => {
    const { statusCode, headers } = proxyRes;

    // ✅ Handle 3xx redirects properly
    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      console.log(`[Redirect] ${statusCode} → ${headers.location}`);
      return res.redirect(statusCode, headers.location);
    }

    // ✅ Forward headers (including Set-Cookie safely)
    res.status(statusCode);
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === "set-cookie") {
        // Set-Cookie must be set using res.setHeader not res.set()
        res.setHeader("Set-Cookie", value);
      } else if (!["transfer-encoding", "content-length"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // ✅ Pipe response body
    proxyRes.pipe(res);
  });

  // ❌ Handle errors like backend offline
  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.status(502).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Server Offline</title>
        <style>
          body {
            background-color: #111;
            color: #ffcc00;
            font-family: sans-serif;
            text-align: center;
            padding-top: 10%;
          }
          h1 { font-size: 2.5em; }
          p { font-size: 1.2em; color: #ccc; }
        </style>
      </head>
      <body>
        <h1>⚠️ Webserver is Offline</h1>
        <p>The backend server is currently unreachable.</p>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  });

  // Pipe the request body
  req.pipe(proxyReq);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy running at http://localhost:${PORT}`);
});
