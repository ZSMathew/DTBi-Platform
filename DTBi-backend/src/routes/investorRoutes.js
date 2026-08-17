const express = require("express");

const {
  createInvestor,
  getInvestors
} = require("../controllers/investorController");

const router = express.Router();

router.post("/", createInvestor);

router.get("/", getInvestors);

module.exports = router;