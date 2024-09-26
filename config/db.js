const mysql = require('mysql2/promise'); // Use promise version
const dotenv = require('dotenv');

dotenv.config();

// Create a pool for MySQL connections
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; // Export the pool for use in controllers
