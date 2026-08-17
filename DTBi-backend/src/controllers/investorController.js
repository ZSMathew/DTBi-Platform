const pool = require("../db/database");

const createInvestor = async (req, res) => {
  try {
    const {
      name,
      email,
      organization,
      investment_interest
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Investor name is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO investors
      (name, email, organization, investment_interest)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        name,
        email || null,
        organization || null,
        investment_interest || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Investor created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating investor:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create investor"
    });
  }
};

const getInvestors = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM investors
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching investors:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch investors"
    });
  }
};

module.exports = {
  createInvestor,
  getInvestors
};