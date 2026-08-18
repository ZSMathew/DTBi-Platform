const express = require("express");

const {
  register,
  login,
  getCurrentUser
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get(
  "/me",
  authenticateToken,
  getCurrentUser
);

router.get(
  "/admin-test",
  authenticateToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin! You have access to this protected resource.",
      user: req.user
    });
  }
);

module.exports = router;