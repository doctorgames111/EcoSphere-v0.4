// db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // required for Neon free tier
  }
});

pool.connect()
  .then(() => console.log("Connected to Neon database!"))
  .catch(err => console.error("Database connection error:", err));

module.exports = pool;