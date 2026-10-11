/**
 * @file init.js
 * @description Initialisation script that ensures a .env file exists, loads environment
 * variables, and generates a self-signed TLS certificate when USE_HTTPS is enabled.
 * Code based on the following source:
 *
 * https://nodejs.org/api/fs.html
 * https://nodejs.org/api/path.html
 * https://www.npmjs.com/package/dotenv
 * https://docs.openssl.org/3.0/man1/openssl-req/
 */
// AI Disclosure: .sh scripts ported by https://share.gemini.google/Mz0xUeqIrTaI

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { execFileSync } = require("child_process")

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

/**
 * Coordinate environment provisioning and certificate generation.
 * Copies .env from .env.example if missing, loads environment variables,
 * and generates a self-signed TLS certificate when USE_HTTPS is "true".
 * @returns {Promise<void>} Resolves when initialisation is complete.
 */
async function init() {
  // Bootstrap local environment configuration from template if missing
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log("[init] Created .env from .env.example");
    } else {
      console.warn("[init] No .env.example found to copy");
    }
  }

  // Load environment variables into runtime process
  dotenv.config({ path: envPath });

  // Generate self-signed TLS certificates for local HTTPS development when enabled
  const useHttps = process.env.USE_HTTPS === "true";
  const keyPath = path.resolve(
    rootDir,
    process.env.SSL_KEY_PATH || "secrets/localhost-key.pem",
  );
  const certPath = path.resolve(
    rootDir,
    process.env.SSL_CERT_PATH || "secrets/localhost-cert.pem",
  );

  if (useHttps) {
    const certsMissing = !fs.existsSync(keyPath) || !fs.existsSync(certPath);

    if (certsMissing) {
      console.log("[init] Generating self-signed TLS certificates...");

      // Ensure certificate destination directories exist
      fs.mkdirSync(path.dirname(keyPath), { recursive: true });
      fs.mkdirSync(path.dirname(certPath), { recursive: true });
      
      // Generate self-signed certificate using OpenSSL command-line tool
      try {
        execFileSync("openssl", [
          "req",
          "-x509",
          "-newkey",
          "rsa:2048",
          "-nodes",
          "-sha256",
          "-days",
          "365",
          "-keyout",
          keyPath,
          "-out",
          certPath,
          "-subj",
          "/CN=localhost",
          "-addext",
          "subjectAltName=DNS:localhost,IP:127.0.0.1",
        ],
        { stdio: "inherit" },
      );
      console.log(`[init] Generated self-signed TLS certificates at ${path.dirname(keyPath)}`);
      } catch (error) {
        throw new Error(`Failed to generate self-signed TLS certificates: ${error.message}`);
      }
    }
  }
  console.log("[init] Initialisation complete.");
}

// Allow execution directly from CLI or as an imported module function
module.exports = init;

if (require.main === module) {
  init().catch((err) => {
    console.error("[init] Failed:", err);
    process.exit(1);
  });
}
