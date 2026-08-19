const pool = require("../db/database");
const csv = require("csv-parser");
const fs = require("fs");

const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required"
      });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", async () => {
        try {
          if (rows.length === 0) {
            fs.unlinkSync(filePath);

            return res.status(400).json({
              success: false,
              message: "CSV file is empty"
            });
          }

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

            if (!row.name || row.name.trim() === "") {
              failedRecords++;

              errors.push({
                row: rowNumber,
                reason: "Startup name is required"
              });

              continue;
            }

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
              await pool.query(
                `INSERT INTO startups
                (
                  name,
                  description,
                  industry,
                  location,
                  founded_year,
                  website
                )
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
              uploaded_by,
              total_records,
              successful_records,
              failed_records,
              upload_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
              fileName,
              "CSV",
              req.user.id,
              rows.length,
              successfulRecords,
              failedRecords,
              uploadStatus
            ]
          );

          fs.unlinkSync(filePath);

          return res.status(201).json({
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

          return res.status(500).json({
            success: false,
            message: "Failed to process CSV file"
          });
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return res.status(400).json({
          success: false,
          message: "Invalid CSV file"
        });
      });

  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      success: false,
      message: "CSV upload failed"
    });
  }
};


const getUploads = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        du.id,
        du.file_name,
        du.file_type,
        du.uploaded_by,
        u.full_name AS uploaded_by_name,
        u.email AS uploaded_by_email,
        du.total_records,
        du.successful_records,
        du.failed_records,
        du.upload_status,
        du.uploaded_at
      FROM data_uploads du
      LEFT JOIN users u
        ON du.uploaded_by = u.id
      ORDER BY du.id DESC`
    );

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error("Error fetching uploads:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch uploads"
    });
  }
};


module.exports = {
  uploadCSV,
  getUploads
};