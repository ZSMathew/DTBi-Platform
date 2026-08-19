const express = require("express");

const {
  createCohort,
  getCohorts,
  getCohortById
} = require("../controllers/cohortController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Only admins can create cohorts
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createCohort
);

// Admins and investors can view all cohorts
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getCohorts
);

// Admins and investors can view one cohort
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "investor"),
  getCohortById
);

module.exports = router;