const express = require("express");
const route = express.Router();

const { getAllCategories } = require("../controllers/category.controller");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

route.get("/", verifyFirebaseToken, getAllCategories);

module.exports = route;
