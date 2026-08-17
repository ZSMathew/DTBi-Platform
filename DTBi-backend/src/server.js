require("dotenv").config();
const startupRoutes = require("./routes/startupRoutes");
const investorRoutes = require("./routes/investorRoutes");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const pool = require("./db/database");

const app = express();
const upload = multer({
  dest: path.join(__dirname, "../uploads/")
});

app.use(cors());
app.use(express.json());


app.use("/api/startups", startupRoutes);
app.use("/api/investors", investorRoutes);



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

app.post("/api/uploads/csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required"
      });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path;

    // Check file extension
    if (path.extname(fileName).toLowerCase() !== ".csv") {
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        message: "Only CSV files are allowed"
      });
    }

    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", async () => {
        const client = await pool.connect();

        try {
          // Check if CSV is empty
          if (rows.length === 0) {
            fs.unlinkSync(filePath);

            return res.status(400).json({
              success: false,
              message: "CSV file is empty"
            });
          }

          // Required columns
          const requiredColumns = [
            "name",
            "description",
            "industry",
            "location",
            "founded_year",
            "website"
          ];

          const columns = Object.keys(rows[0]);

          const missingColumns = requiredColumns.filter(
            (column) => !columns.includes(column)
          );

          if (missingColumns.length > 0) {
            fs.unlinkSync(filePath);

            return res.status(400).json({
              success: false,
              message: "CSV is missing required columns",
              missing_columns: missingColumns
            });
          }

          let successfulRecords = 0;
          let failedRecords = 0;

          const errors = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            // Validate startup name
            if (!row.name || row.name.trim() === "") {
              failedRecords++;

              errors.push({
                row: rowNumber,
                reason: "Startup name is required"
              });

              continue;
            }

            // Validate founded year
            if (
              row.founded_year &&
              !/^\d{4}$/.test(row.founded_year.trim())
            ) {
              failedRecords++;

              errors.push({
                row: rowNumber,
                reason: "Founded year must be a valid 4-digit year"
              });

              continue;
            }

            try {
              await client.query(
                `INSERT INTO startups
                (name, description, industry, location, founded_year, website)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                  row.name.trim(),
                  row.description || null,
                  row.industry || null,
                  row.location || null,
                  row.founded_year
                    ? parseInt(row.founded_year)
                    : null,
                  row.website || null
                ]
              );

              successfulRecords++;

            } catch (rowError) {

              failedRecords++;

              let reason = "Failed to insert startup";

              if (rowError.code === "23505") {
                reason = "Startup already exists";
              }

              errors.push({
                row: rowNumber,
                reason
              });
            }
          }

          const uploadStatus =
            failedRecords === 0
              ? "completed"
              : successfulRecords === 0
              ? "failed"
              : "completed_with_errors";

          const uploadResult = await pool.query(
            `INSERT INTO data_uploads
            (
              file_name,
              file_type,
              total_records,
              successful_records,
              failed_records,
              upload_status
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
              fileName,
              "CSV",
              rows.length,
              successfulRecords,
              failedRecords,
              uploadStatus
            ]
          );

          fs.unlinkSync(filePath);

          res.status(201).json({
            success: true,
            message: "CSV processed successfully",
            upload: uploadResult.rows[0],
            errors
          });

        } catch (error) {

          console.error("CSV processing error:", error);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.status(500).json({
            success: false,
            message: "Failed to process CSV file"
          });

        } finally {
          client.release();
        }
      })
      .on("error", (error) => {

        console.error("CSV parsing error:", error);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(400).json({
          success: false,
          message: "Invalid CSV file"
        });
      });

  } catch (error) {

    console.error("Upload error:", error);

    res.status(500).json({
      success: false,
      message: "CSV upload failed"
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

//dashboard endpoint
app.get("/api/dashboard/startups", async (req, res) => {
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
    console.error("Dashboard query error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data"
    });
  }
});

//dashboard metrics summary endpoint
app.get("/api/dashboard/summary", async (req, res) => {
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


//investments endpoint
app.post("/api/investments", async (req, res) => {
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

//get investments endpoint
app.get("/api/investments", async (req, res) => {
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