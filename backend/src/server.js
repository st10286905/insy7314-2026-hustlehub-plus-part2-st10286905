require('dotenv').config();

const fs = require('fs');
const https = require('https');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`[HustleHub+ API] Listening on https://localhost:${PORT}`);
});