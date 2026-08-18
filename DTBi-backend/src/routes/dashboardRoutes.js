const express = require("express");

const {
  getDashboardSummary,
  getDashboardStartups
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/summary", getDashboardSummary);

router.get("/startups", getDashboardStartups);

module.exports = router;