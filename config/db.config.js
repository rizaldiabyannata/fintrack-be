const mongoose = require("mongoose");
const logger = require("../utils/logUtils");

require("dotenv").config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
