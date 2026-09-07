/**
 * @file server.js
 * @description HTTP/HTTPS server entry point: loads TLS credentials when enabled
 * and starts the Express app on the configured port.
 * Code based on the following source:
 *
 * https://nodejs.org/api/http.html
 * https://nodejs.org/api/https.html
 * https://nodejs.org/api/fs.html
 */

const fs = require("fs");
const http = require("http");
const https = require("https");
const app = require("./app");
const config = require("./config");

let server;

if (config.ssl.useHttps) {
  const sslOptions = {
    key: fs.readFileSync(config.ssl.keyPath),
    cert: fs.readFileSync(config.ssl.certPath),
  };
  server = https.createServer(sslOptions, app);
} else {
  server = http.createServer(app);
}

server.listen(config.port, () => {
  const protocol = config.ssl.useHttps ? "https" : "http";
  console.log(
    `[HustleHub+ API] Listening on ${protocol}://localhost:${config.port}`,
  );
});
