const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccountPath = path.resolve(
  __dirname,
  "../../shared/firebase/fintrack-2f63a-firebase-adminsdk-fbsvc-d72d5e3a72.json"
);

const serviceAccountRaw = fs.readFileSync(serviceAccountPath, "utf-8");
const serviceAccount = JSON.parse(serviceAccountRaw);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
