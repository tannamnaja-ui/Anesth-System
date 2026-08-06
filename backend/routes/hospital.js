const express = require('express');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');

const router = express.Router();

// Read-only lookup for branding purposes (shown next to "Anesth System" in
// the header). No auth required — same as /settings/test-connection, it
// only needs a configured connection, not a logged-in officer.
router.get('/name', async (req, res) => {
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.json({ success: true, data: null });
  }
  const { dbType, ...dbConfig } = connectionConfig;

  try {
    const rows = await withConnection(dbType, dbConfig, (conn) =>
      conn.query('SELECT hospitalname FROM opdconfig LIMIT 1')
    );
    res.json({ success: true, data: rows[0]?.hospitalname || null });
  } catch {
    // Branding is non-essential — never block the page over this.
    res.json({ success: true, data: null });
  }
});

module.exports = router;
