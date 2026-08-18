const express = require("express");

const {
  createCohort,
  getCohorts,
  getCohortById
} = require("../controllers/cohortController");

const router = express.Router();

router.post("/", createCohort);

router.get("/", getCohorts);

router.get("/:id", getCohortById);

module.exports = router;