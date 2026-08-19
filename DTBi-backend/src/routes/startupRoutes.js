const express = require("express");

const {
  createStartup,
  getStartups
} = require("../controllers/startupController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only administrators can create startups
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createStartup
);

// Admins, investors and startups can view startups
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "investor", "startup"),
  getStartups
);

module.exports = router;