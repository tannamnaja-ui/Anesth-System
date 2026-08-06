const express = require('express');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');

const router = express.Router();

// Read-only lookup for the "ห้องทำงาน" dropdown on the login page — needed
// before the officer is authenticated, so no auth required here (same as
// /settings/test-connection and /hospital/name).
router.get('/', async (req, res) => {
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.json({ success: true, data: [] });
  }
  const { dbType, ...dbConfig } = connectionConfig;

  try {
    const rows = await withConnection(dbType, dbConfig, (conn) =>
      conn.query("SELECT department FROM kskdepartment WHERE depcode_active = 'Y' ORDER BY department")
    );
    res.json({ success: true, data: rows.map((r) => r.department).filter(Boolean) });
  } catch (err) {
    res.status(500).json({ success: false, message: `ดึงรายชื่อห้องทำงานไม่สำเร็จ: ${err.message}` });
  }
});

module.exports = router;
