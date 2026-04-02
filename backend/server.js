const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 6001;

/**
 * IMPORTANT:
 * Bind to 0.0.0.0 so browser + IPv4/IPv6 both work
 */
app.use(cors({ origin: "*" }));
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'app-logs.jsonl');

// --- Terminal Colors ---
const COLORS = {
  reset: "\x1b[0m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  debug: "\x1b[90m",
  success: "\x1b[32m"
};

app.post('/log', async (req, res) => {
  const log = {
    ...req.body,
    receivedAt: new Date().toISOString(),
  };

  try {
    await pool.query(
      `INSERT INTO logs
      (app_name, service, environment, level, message, timestamp, received_at, url, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        log.appName,
        log.service,
        log.environment,
        log.level,
        log.message,
        log.timestamp,
        log.receivedAt,
        log.url || null,
        log.metadata || {}
      ]
    );

    printToTerminal(log);
    res.status(200).json({ status: "ok" });

  } catch (err) {
    console.error("❌ DB Error:", err.message);
    res.status(500).json({ error: "Failed to store log" });
  }
});

function printToTerminal(entry) {
  const level = (entry.level || 'INFO').toUpperCase();
  const message = entry.message || '';
  const time = new Date().toLocaleTimeString();

  let color = COLORS.info;
  if (level.includes('ERROR')) color = COLORS.error;
  else if (level.includes('WARN')) color = COLORS.warn;

  console.log(
    `${COLORS.debug}[${time}]${COLORS.reset} ${color}[${level}]${COLORS.reset} ${message}`
  );

  if (entry.url) {
    console.log(`${COLORS.debug}   ↳ URL: ${entry.url}${COLORS.reset}`);
  }
}

//To get logs//
// server.js

app.get('/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch only the required slice of logs
    const result = await pool.query(
      `SELECT *, count(*) OVER() AS total_count 
       FROM logs 
       ORDER BY received_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalLogs = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

    res.json({
      logs: result.rows,
      totalPages: Math.ceil(totalLogs / limit),
      totalLogs
    });
  } catch (err) {
    console.error("❌ DB Error fetching logs:", err.message);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

//full text search using gin indexing
// Optimized full-text search using GIN indexing
app.get('/search/gin', async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.json({
      time_ms: 0,
      rows: [],
      totalPages: 0,
      totalRows: 0
    });
  }

  const offset = (page - 1) * limit;
  const start = Date.now();

  try {
  
    const result = await pool.query(
      `SELECT *, count(*) OVER() AS total_count 
       FROM logs 
       WHERE message_tsv @@ plainto_tsquery('english', $1)
       ORDER BY received_at DESC 
       LIMIT $2 OFFSET $3`,
      [q, limit, offset]
    );

    const rows = result.rows;
    // Extract total count from the first row if results exist
    const totalRows = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const totalPages = Math.ceil(totalRows / limit);

    res.json({
      time_ms: Date.now() - start,
      rows: rows,
      totalRows,
      totalPages,
      currentPage: parseInt(page)
    });

  } catch (err) {
    console.error("❌ GIN search failed:", err.message);
    res.status(500).json({ error: "GIN search failed" });
  }
});


//normal search to compare time
app.get('/search/normal', async (req, res) => {
  const { q } = req.query;
  const start = Date.now();

  try {
    const result = await pool.query(
      `SELECT * FROM logs 
       WHERE message ILIKE $1 
       ORDER BY received_at DESC `,
      [`%${q}%`]
    );

    const timeTaken = Date.now() - start;

    res.json({
      time_ms: timeTaken,
      rows: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Normal search failed" });
  }
});

// NEW: Endpoint to fetch dynamic options for the dropdowns
app.get('/logs/filter-options', async (req, res) => {
  try {
    const apps = await pool.query(`SELECT DISTINCT app_name FROM logs WHERE app_name IS NOT NULL`);
    const services = await pool.query(`SELECT DISTINCT service FROM logs WHERE service IS NOT NULL`);
    
    res.json({
      apps: apps.rows.map(r => r.app_name),
      services: services.rows.map(r => r.service)
    });
  } catch (err) {
    console.error("❌ DB Error fetching filter options:", err.message);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// NEW: Endpoint to fetch logs based on selected dropdown filters
app.get('/logs/filter', async (req, res) => {
  const { app_name, level, service } = req.query;
  
  let query = `SELECT * FROM logs WHERE 1=1`;
  const params = [];
  let paramIdx = 1;

  if (app_name) {
    query += ` AND app_name = $${paramIdx++}`;
    params.push(app_name);
  }
  if (level) {
    query += ` AND level ILIKE $${paramIdx++}`;
    params.push(level);
  }
  if (service) {
    query += ` AND service = $${paramIdx++}`;
    params.push(service);
  }

  query += ` ORDER BY received_at DESC LIMIT 100`;

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ DB Error filtering logs:", err.message);
    res.status(500).json({ error: "Failed to filter logs" });
  }
});

app.get('/logs/stats', async (req, res) => {
  try {
    // 1. Total Counts
    const totalRes = await pool.query('SELECT COUNT(*) FROM logs');
    const totalLogs = parseInt(totalRes.rows[0].count);

    // 2. Counts by Level
    const levelsRes = await pool.query('SELECT level, COUNT(*) FROM logs GROUP BY level');
    const levelCounts = { error: 0, warn: 0, info: 0, debug: 0, success: 0 };
    levelsRes.rows.forEach(row => {
      if (row.level) levelCounts[row.level.toLowerCase()] = parseInt(row.count);
    });

    // 3. Top Services
    const servicesRes = await pool.query(
      'SELECT service, COUNT(*) as count FROM logs WHERE service IS NOT NULL GROUP BY service ORDER BY count DESC LIMIT 5'
    );

    // 4. Logs over time (Last 24 hours grouped by hour)
    const timeRes = await pool.query(`
      SELECT date_trunc('hour', received_at) as time, COUNT(*) as count
      FROM logs
      WHERE received_at >= NOW() - INTERVAL '24 hours'
      GROUP BY time
      ORDER BY time ASC
    `);

    // 5. Active Environments
    const envRes = await pool.query('SELECT DISTINCT environment FROM logs WHERE environment IS NOT NULL');

    // 6. Error Rate
    const errorRate = totalLogs > 0 ? ((levelCounts.error / totalLogs) * 100).toFixed(2) : 0;

    res.json({
      totalLogs,
      levelCounts,
      topServices: servicesRes.rows,
      logsOverTime: timeRes.rows,
      environments: envRes.rows.map(r => r.environment),
      errorRate: `${errorRate}%`,
      systemHealth: errorRate > 10 ? 'Critical' : errorRate > 5 ? 'Warning' : 'Healthy'
    });
  } catch (err) {
    console.error("❌ DB Error fetching stats:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// --- EXPORT ENDPOINT ---
app.get('/logs/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const result = await pool.query('SELECT * FROM logs ORDER BY received_at DESC LIMIT 5000');
    const logs = result.rows;

    if (format === 'csv') {
      if (logs.length === 0) return res.send("");
      const header = Object.keys(logs[0]).join(',');
      const rows = logs.map(log => 
        Object.values(log).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
      );
      res.header('Content-Type', 'text/csv');
      res.attachment('logs.csv');
      return res.send([header, ...rows].join('\n'));
    } else {
      res.header('Content-Type', 'application/json');
      res.attachment('logs.json');
      return res.send(JSON.stringify(logs, null, 2));
    }
  } catch (err) {
    console.error("❌ Export failed:", err.message);
    res.status(500).json({ error: "Export failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`${COLORS.success}🚀 Log Collector listening on port ${PORT}${COLORS.reset}`);
  console.log(`${COLORS.debug}   Waiting for logs from React App...\n${COLORS.reset}`);
});
