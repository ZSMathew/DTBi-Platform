const express = require("express");

const {
  createInvestor,
  getInvestors
} = require("../controllers/investorController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only admins can create investors
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createInvestor
);

// Admins and investors can view investors
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getInvestors
);

module.exports = router;