require("dotenv").config();
const startupRoutes = require("./routes/startupRoutes");
const investorRoutes = require("./routes/investorRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const cohortRoutes = require("./routes/cohortRoutes");
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const pool = require("./db/database");

const app = express();


app.use(cors());
app.use(express.json());


app.use("/api/startups", startupRoutes);
app.use("/api/investors", investorRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/cohorts", cohortRoutes);
app.use("/api/auth", authRoutes);



app.get("/", (req, res) => {
  res.json({
    message: "DTBi Data Platform Backend is running"
  });
});
    

//database test endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      connected: true,
      time: result.rows[0]
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      connected: false,
      message: "Database connection failed"
    });
  }
});

//startups endpoint
app.get("/api/startups", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM startups ORDER BY id DESC"
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Error fetching startups:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch startups"
    });
  }
});

//postup endpoint 
app.post("/api/startups", async (req, res) => {
  try {
    const {
      name,
      description,
      industry,
      location,
      founded_year,
      website,
      cohort_id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Startup name is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO startups
       (name, description, industry, location, founded_year, website, cohort_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description || null,
        industry || null,
        location || null,
        founded_year || null,
        website || null,
        cohort_id || null
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
});

//update endpoint
app.put("/api/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      industry,
      location,
      founded_year,
      website,
      cohort_id
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Startup name is required"
      });
    }

    const result = await pool.query(
      `UPDATE startups
       SET name = $1,
           description = $2,
           industry = $3,
           location = $4,
           founded_year = $5,
           website = $6,
           cohort_id = $7
       WHERE id = $8
       RETURNING *`,
      [
        name,
        description || null,
        industry || null,
        location || null,
        founded_year || null,
        website || null,
        cohort_id || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found"
      });
    }

    res.json({
      success: true,
      message: "Startup updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating startup:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update startup"
    });
  }
});


//delete endpoint
app.delete("/api/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM startups WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found"
      });
    }

    res.json({
      success: true,
      message: "Startup deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting startup:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete startup"
    });
  }
});



//metrics API
app.post("/api/startups/:startupId/metrics", async (req, res) => {
  try {
    const { startupId } = req.params;

    const {
      reporting_date,
      revenue,
      expenses,
      employees,
      customers,
      growth_rate
    } = req.body;

    // Check if startup exists
    const startup = await pool.query(
      "SELECT id FROM startups WHERE id = $1",
      [startupId]
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
        startupId,
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
      message: "Startup metrics created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error creating startup metrics:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create startup metrics"
    });
  }
});


//metrics retrieval API
app.get("/api/startups/:startupId/metrics", async (req, res) => {
  try {
    const { startupId } = req.params;

    const startup = await pool.query(
      "SELECT id, name FROM startups WHERE id = $1",
      [startupId]
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
      [startupId]
    );

    res.json({
      success: true,
      startup: startup.rows[0],
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching startup metrics:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch startup metrics"
    });
  }
});



//investors endpoint
app.post("/api/investors", async (req, res) => {
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
});




//get investor endpoint
app.get("/api/investors", async (req, res) => {
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
});



//get startup metrics endpoint
app.get("/api/startups/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const startupResult = await pool.query(
      `SELECT *
       FROM startups
       WHERE id = $1`,
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Startup not found"
      });
    }

    const metricsResult = await pool.query(
      `SELECT *
       FROM startup_metrics
       WHERE startup_id = $1
       ORDER BY reporting_date DESC`,
      [id]
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
      [id]
    );

    res.json({
      success: true,
      data: {
        startup: startupResult.rows[0],
        metrics: metricsResult.rows,
        investments: investmentsResult.rows
      }
    });

  } catch (error) {
    console.error("Error fetching startup details:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch startup details"
    });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DTBi backend running on port ${PORT}`);
});