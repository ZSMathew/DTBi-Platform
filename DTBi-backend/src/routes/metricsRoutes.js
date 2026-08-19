const express = require("express");

const {
  createMetric,
  getMetricsByStartup
} = require("../controllers/metricsController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Admins and startups can create metrics
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "startup"),
  createMetric
);

// Admins, investors and startups can view startup metrics
router.get(
  "/startup/:startup_id",
  authenticateToken,
  authorizeRoles("admin", "investor", "startup"),
  getMetricsByStartup
);

module.exports = router;