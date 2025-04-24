const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db.config.js");
const route = require("./routes/transaction.routes.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware global
app.use(cors("*"));
app.use(express.json());
app.use(morgan("dev"));

connectDB();

// Contoh route proteksi
app.get("/", (req, res) => {
  res.send("Transaction Service is running");
});

app.use("/api/transaction/", route);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Transaction Service running on port ${PORT}`);
});
