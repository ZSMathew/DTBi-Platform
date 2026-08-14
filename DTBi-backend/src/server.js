require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DTBi Data Platform Backend is running"
  });
});

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DTBi backend running on port ${PORT}`);
});