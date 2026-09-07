/**
 * @file index.js
 * @description Loads environment variables from .env and exposes a frozen,
 * normalized application configuration object.
 * Code based on the following source:
 *
 * https://www.npmjs.com/package/dotenv
 * https://nodejs.org/api/process.html
 * https://nodejs.org/api/path.html
 */

const path = require("path");
const dotenv = require("dotenv");

const rootDir = path.resolve(__dirname, "../..");
const envPath = path.join(rootDir, ".env");

dotenv.config({ path: envPath });

const env = process.env.NODE_ENV || "development";
const useHttps = process.env.USE_HTTPS === "true";
const defaultProtocol = useHttps ? "https" : "http";

const defaultClientPort = process.env.CLIENT_PORT || 5173;
const fallbackOrigin = `${defaultProtocol}://localhost:${defaultClientPort}`;

const config = Object.freeze({
  env,
  isProduction: env === "production",
  isDevelopment: env === "development",
  isTest: env === "test",
  port: parseInt(process.env.PORT, 10) || 3000,
  clientOrigin: process.env.CLIENT_ORIGIN || fallbackOrigin,
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "temporary_development_secret_to_be_replaced_with_secure_random_hex",
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  },
  ssl: {
    useHttps,
    keyPath: path.resolve(
      rootDir,
      process.env.SSL_KEY_PATH || "secrets/localhost-key.pem",
    ),
    certPath: path.resolve(
      rootDir,
      process.env.SSL_CERT_PATH || "secrets/localhost-cert.pem",
    ),
  },
});

module.exports = config;
