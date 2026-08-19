const express = require("express");

const upload = require("../middleware/uploadMiddleware");

const {
  uploadCSV,
  getUploads
} = require("../controllers/uploadController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/csv",
  authenticateToken,
  authorizeRoles("admin"),
  upload.single("file"),
  uploadCSV
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getUploads
);

module.exports = router;