// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const mysql = require("mysql2");

// const app = express();
// app.use(cors());
// app.use(bodyParser.json());
// app.use(express.static(__dirname)); // serve landing page

// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// db.connect((err) => {
//   if (err) console.log("DB Error:", err);
//   else console.log("DB connected!");
// });

// // Test route
// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

// // Get all patients
// app.get("/patients", (req, res) => {
//   const sql = "SELECT * FROM patients";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(results);
//   });
// });

// // Get single patient by ID
// app.get("/patient/:id", (req, res) => {
//   const patientId = req.params.id;
//   const sql = "SELECT * FROM patients WHERE id = ?";
//   db.query(sql, [patientId], (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     if (results.length === 0)
//       return res.status(404).json({ error: "Patient not found" });

//     // Fetch donor messages for progress
//     const donorSql = "SELECT * FROM donors WHERE patient_id = ?";
//     db.query(donorSql, [patientId], (err2, donors) => {
//       if (err2) return res.status(500).json({ error: err2 });
//       res.json({ patient: results[0], donors });
//     });
//   });
// });

// // Donate API
// app.post("/donate", (req, res) => {
//   const { donor_name, donation_amount, message, patient_id } = req.body;
//   const sql =
//     "INSERT INTO donors (name, donation_amount, patient_id, message) VALUES (?, ?, ?, ?)";
//   db.query(
//     sql,
//     [donor_name, donation_amount, patient_id, message],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: err });

//       // Update patient's progress
//       const progressSql =
//         "UPDATE patients SET progress = progress + ? WHERE id = ?";
//       db.query(progressSql, [donation_amount, patient_id], (err2, result2) => {
//         if (err2) return res.status(500).json({ error: err2 });
//         res.json({ success: true, message: "Donation added" });
//       });
//     }
//   );
// });

// // Admin routes
// // Toggle verified
// app.post("/admin/verify", (req, res) => {
//   const { patient_id } = req.body;
//   const sql = "UPDATE patients SET verified = NOT verified WHERE id = ?";
//   db.query(sql, [patient_id], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ success: true });
//   });
// });

// // Dummy emergency fund release
// app.post("/admin/emergency", (req, res) => {
//   const { patient_id, amount } = req.body;
//   console.log(
//     `Emergency fund released: Patient ID ${patient_id}, Amount ${amount}`
//   );
//   res.json({ success: true, message: "Emergency fund released (dummy)" });
// });

// // List all patients for admin
// app.get("/admin/patients", (req, res) => {
//   const sql = "SELECT * FROM patients";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(results);
//   });
// });
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
