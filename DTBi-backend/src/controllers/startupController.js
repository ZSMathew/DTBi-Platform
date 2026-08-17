const pool = require("../db/database");

const createStartup = async (req, res) => {
  try {
    const {
      name,
      description,
      industry,
      location,
      founded_year,
      website
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Startup name is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO startups
      (name, description, industry, location, founded_year, website)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        name,
        description || null,
        industry || null,
        location || null,
        founded_year || null,
        website || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Startup created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating startup:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create startup"
    });
  }
};

const getStartups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM startups
       ORDER BY id DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching startups:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch startups"
    });
  }
};

module.exports = {
  createStartup,
  getStartups
};