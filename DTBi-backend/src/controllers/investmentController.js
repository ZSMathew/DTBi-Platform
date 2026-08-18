const pool = require("../db/database");

const createInvestment = async (req, res) => {
  try {
    const {
      investor_id,
      startup_id,
      amount,
      investment_date
    } = req.body;

    if (!investor_id || !startup_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "Investor, startup and investment amount are required"
      });
    }

    // Check investor
    const investor = await pool.query(
      "SELECT id, name FROM investors WHERE id = $1",
      [investor_id]
    );

    if (investor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }

    // Check startup
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
      `INSERT INTO investments
      (investor_id, startup_id, amount, investment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        investor_id,
        startup_id,
        amount,
        investment_date || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Investment created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating investment:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create investment"
    });
  }
};


const getInvestments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.amount,
        i.investment_date,

        inv.id AS investor_id,
        inv.name AS investor_name,
        inv.organization,

        s.id AS startup_id,
        s.name AS startup_name,
        s.industry

      FROM investments i

      JOIN investors inv
        ON i.investor_id = inv.id

      JOIN startups s
        ON i.startup_id = s.id

      ORDER BY i.investment_date DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching investments:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch investments"
    });
  }
};


module.exports = {
  createInvestment,
  getInvestments
};