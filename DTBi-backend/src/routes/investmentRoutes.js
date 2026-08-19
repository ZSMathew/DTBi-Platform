const express = require("express");

const {
  createInvestment,
  getInvestments
} = require("../controllers/investmentController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Admins and investors can create investments
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  createInvestment
);

// Admins and investors can view investments
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getInvestments
);

module.exports = router;