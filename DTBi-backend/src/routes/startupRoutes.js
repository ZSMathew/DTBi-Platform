const express = require("express");

const {
  createStartup,
  getStartups
} = require("../controllers/startupController");

const router = express.Router();

router.post("/", createStartup);

router.get("/", getStartups);

module.exports = router;