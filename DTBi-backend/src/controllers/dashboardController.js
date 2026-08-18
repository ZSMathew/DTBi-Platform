const pool = require("../db/database");

const getDashboardSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM startups) AS total_startups,
        (SELECT COUNT(*) FROM investors) AS total_investors,
        (SELECT COUNT(*) FROM investments) AS total_investments,
        (SELECT COALESCE(SUM(amount), 0) FROM investments) AS total_investment_amount,
        (SELECT COUNT(*) FROM data_uploads) AS total_uploads
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary"
    });
  }
};


const getDashboardStartups = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.industry,
        s.location,
        s.founded_year,
        m.reporting_date,
        m.revenue,
        m.expenses,
        m.employees,
        m.customers,
        m.growth_rate

      FROM startups s

      LEFT JOIN LATERAL (
        SELECT *
        FROM startup_metrics sm
        WHERE sm.startup_id = s.id
        ORDER BY sm.reporting_date DESC
        LIMIT 1
      ) m ON true

      ORDER BY s.id;
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Dashboard startups error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard startups"
    });
  }
};


module.exports = {
  getDashboardSummary,
  getDashboardStartups
};