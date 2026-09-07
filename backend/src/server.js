require('dotenv').config();

const fs = require('fs');
const https = require('https');

const app = require('./app');

const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === "true";

if (USE_HTTPS) {
  const keyPath =
    process.env.SSL_KEY_PATH ||
    path.join(__dirname, "secrets", "localhost-key.pem");
  const certPath =
    process.env.SSL_CERT_PATH ||
    path.join(__dirname, "secrets", "localhost-cert.pem");

  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`[HustleHub+ API] Listening on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`[HustleHub+ API] Listening on http://localhost:${PORT}`);
  });
}
