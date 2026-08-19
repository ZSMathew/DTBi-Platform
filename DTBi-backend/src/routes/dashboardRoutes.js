const express = require("express");

const {
  getDashboardSummary,
  getDashboardStartups,
  getInvestorDashboard,
  getStartupDashboard
} = require("../controllers/dashboardController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/summary",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getDashboardSummary
);

router.get(
  "/startups",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getDashboardStartups
);

router.get(
  "/investor",
  authenticateToken,
  authorizeRoles("investor"),
  getInvestorDashboard
);

router.get(
  "/startup",
  authenticateToken,
  authorizeRoles("startup"),
  getStartupDashboard
);

module.exports = router;