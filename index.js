const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db.config.js");
const route = require("./routes/index.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware global
app.use(cors("*"));
app.use(express.json());

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/access.log"),
  { flags: "a" }
);

// Menggunakan morgan dengan format 'combined' untuk menyimpan log ke file
app.use(morgan("combined", { stream: accessLogStream }));

connectDB();

// Contoh route proteksi
app.get("/", (req, res) => {
  res.send("Auth Service is running");
});

app.use("/api", route);

app.get("/api/test", (req, res) => {
  res.send("Server is reachable");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});

module.exports = app;
