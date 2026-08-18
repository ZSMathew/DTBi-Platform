const express = require("express");

const upload = require("../middleware/uploadMiddleware");

const {
  uploadCSV
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/csv",
  upload.single("file"),
  uploadCSV
);

module.exports = router;