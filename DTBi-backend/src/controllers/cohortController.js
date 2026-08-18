const pool = require("../db/database");

const createCohort = async (req, res) => {
  try {
    const {
      name,
      description,
      start_date,
      end_date
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Cohort name is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO cohorts
      (
        name,
        description,
        start_date,
        end_date
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        name,
        description || null,
        start_date || null,
        end_date || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Cohort created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating cohort:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create cohort"
    });
  }
};


const getCohorts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM cohorts
       ORDER BY start_date DESC NULLS LAST, id DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching cohorts:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cohorts"
    });
  }
};


const getCohortById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM cohorts
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cohort not found"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error fetching cohort:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch cohort"
    });
  }
};


module.exports = {
  createCohort,
  getCohorts,
  getCohortById
};