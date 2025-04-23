const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { verifyFirebaseToken } = require("./middleware/firebaseAuth.js");

const connectDB = require("./config/db.config.js");
const route = require("./routes/category.routes.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware global
app.use(cors("*"));
app.use(express.json());
app.use(morgan("dev"));

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
  console.log(`🚀 Category Service running on port ${PORT}`);
});
