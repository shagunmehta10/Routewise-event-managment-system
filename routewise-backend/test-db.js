const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "routewise",
  password: "Shagun@10",
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("Connection Failed:", err.message);
  } else {
    console.log("Success! Connected to PostgreSQL at:", res.rows[0].now);
  }
  pool.end();
});
