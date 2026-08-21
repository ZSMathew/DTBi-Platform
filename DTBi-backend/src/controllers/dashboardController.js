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


const getInvestorDashboard = async (req, res) => {
  try {
    const investorResult = await pool.query(
      `SELECT
        id,
        name,
        email,
        organization,
        investment_interest,
        created_at
      FROM investors
      WHERE user_id = $1`,
      [req.user.id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Investor profile not found"
      });
    }

    const investor = investorResult.rows[0];

    const investmentResult = await pool.query(
      `SELECT
        i.id,
        i.amount,
        i.investment_date,
        s.id AS startup_id,
        s.name AS startup_name,
        s.industry,
        s.location
      FROM investments i
      JOIN startups s
        ON i.startup_id = s.id
      WHERE i.investor_id = $1
      ORDER BY i.investment_date DESC`,
      [investor.id]
    );

    const summaryResult = await pool.query(
      `SELECT
        COUNT(*) AS total_investments,
        COALESCE(SUM(amount), 0) AS total_amount_invested
      FROM investments
      WHERE investor_id = $1`,
      [investor.id]
    );

    res.json({
      success: true,
      data: {
        investor,
        summary: summaryResult.rows[0],
        investments: investmentResult.rows
      }
    });

  } catch (error) {
    console.error("Investor dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load investor dashboard"
    });
  }
};


const getStartupDashboard = async (req, res) => {
  try {
    const startupResult = await pool.query(
      `SELECT
        id,
        name,
        description,
        industry,
        location,
        founded_year,
        website,
        created_at
      FROM startups
      WHERE user_id = $1`,
      [req.user.id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup profile not found"
      });
    }

    const startup = startupResult.rows[0];

    const metricsResult = await pool.query(
      `SELECT
        id,
        reporting_date,
        revenue,
        expenses,
        employees,
        customers,
        growth_rate
      FROM startup_metrics
      WHERE startup_id = $1
      ORDER BY reporting_date DESC`,
      [startup.id]
    );

    const investmentsResult = await pool.query(
      `SELECT
        i.id,
        i.amount,
        i.investment_date,
        inv.name AS investor_name,
        inv.organization
      FROM investments i
      JOIN investors inv
        ON i.investor_id = inv.id
      WHERE i.startup_id = $1
      ORDER BY i.investment_date DESC`,
      [startup.id]
    );

    res.json({
      success: true,
      data: {
        startup,
        metrics: metricsResult.rows,
        investments: investmentsResult.rows
      }
    });

  } catch (error) {
    console.error("Startup dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load startup dashboard"
    });
  }
};


module.exports = {
  getDashboardSummary,
  getDashboardStartups,
  getInvestorDashboard,
  getStartupDashboard
};