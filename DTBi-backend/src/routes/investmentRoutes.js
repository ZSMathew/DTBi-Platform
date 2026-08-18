const express = require("express");

const {
  createInvestment,
  getInvestments
} = require("../controllers/investmentController");

const router = express.Router();

router.post("/", createInvestment);

router.get("/", getInvestments);

module.exports = router;