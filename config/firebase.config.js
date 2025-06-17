const admin = require("firebase-admin");
const serviceAccountEncoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!serviceAccountEncoded) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set."
  );
}

// Decode dari Base64 ke string JSON, lalu parse
const serviceAccountRaw = Buffer.from(serviceAccountEncoded, "base64").toString(
  "utf-8"
);
const serviceAccount = JSON.parse(serviceAccountRaw);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
