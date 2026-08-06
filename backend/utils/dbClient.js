const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');

// Opens a short-lived connection, runs `work(conn)`, and always closes it.
// Keeps callers (test-connection, login) from having to know about the
// mysql2 vs pg API differences.
async function withConnection(dbType, config, work) {
  if (dbType === 'mysql') {
    const conn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      connectTimeout: 5000,
    });
    try {
      return await work({
        query: async (sql, params) => {
          const [rows] = await conn.execute(sql, params);
          return rows;
        },
      });
    } finally {
      await conn.end();
    }
  }

  if (dbType === 'postgresql') {
    const client = new PgClient({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      connectionTimeoutMillis: 5000,
    });
    await client.connect();
    try {
      return await work({
        query: async (sql, params) => {
          const res = await client.query(sql, params);
          return res.rows;
        },
      });
    } finally {
      await client.end();
    }
  }

  throw new Error(`ไม่รู้จักชนิดฐานข้อมูล: ${dbType}`);
}

module.exports = { withConnection };
