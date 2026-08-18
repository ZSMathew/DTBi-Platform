const pool = require("../db/database");

const createMetric = async (req, res) => {
  try {
    const {
      startup_id,
      reporting_date,
      revenue,
      expenses,
      employees,
      customers,
      growth_rate
    } = req.body;

    if (!startup_id || !reporting_date) {
      return res.status(400).json({
        success: false,
        message: "Startup ID and reporting date are required"
      });
    }

    // Check whether the startup exists
    const startup = await pool.query(
      "SELECT id, name FROM startups WHERE id = $1",
      [startup_id]
    );

    if (startup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found"
      });
    }

    const result = await pool.query(
      `INSERT INTO startup_metrics
      (
        startup_id,
        reporting_date,
        revenue,
        expenses,
        employees,
        customers,
        growth_rate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        startup_id,
        reporting_date,
        revenue || 0,
        expenses || 0,
        employees || 0,
        customers || 0,
        growth_rate || 0
      ]
    );

    res.status(201).json({
      success: true,
      message: "Startup metric created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating startup metric:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create startup metric"
    });
  }
};


const getMetricsByStartup = async (req, res) => {
  try {
    const { startup_id } = req.params;

    const startup = await pool.query(
      "SELECT id, name FROM startups WHERE id = $1",
      [startup_id]
    );

    if (startup.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found"
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM startup_metrics
       WHERE startup_id = $1
       ORDER BY reporting_date DESC`,
      [startup_id]
    );

    res.json({
      success: true,
      startup: startup.rows[0],
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching startup metrics:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch startup metrics"
    });
  }
};


module.exports = {
  createMetric,
  getMetricsByStartup
};