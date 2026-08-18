const express = require("express");

const {
  createMetric,
  getMetricsByStartup
} = require("../controllers/metricsController");

const router = express.Router();

router.post("/", createMetric);

router.get("/startup/:startup_id", getMetricsByStartup);

module.exports = router;