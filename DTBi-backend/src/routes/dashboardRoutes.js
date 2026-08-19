const express = require("express");

const {
  getDashboardSummary,
  getDashboardStartups
} = require("../controllers/dashboardController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Admins and investors can view the dashboard summary
router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getDashboardSummary
);

// Admins and investors can view dashboard startup data
router.get(
  "/startups",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getDashboardStartups
);

module.exports = router;