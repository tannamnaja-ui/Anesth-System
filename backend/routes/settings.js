const express = require('express');
const { withConnection } = require('../utils/dbClient');
const { saveConnectionConfig, hasSavedConnection } = require('../utils/connectionStore');

const router = express.Router();

const VALID_DB_TYPES = ['mysql', 'postgresql'];

function validateBody(req, res) {
  const { dbType, host, port, database, username, password } = req.body;

  if (!dbType || !VALID_DB_TYPES.includes(dbType)) {
    res.status(400).json({ success: false, message: 'กรุณาเลือกชนิดฐานข้อมูล (MySQL หรือ PostgreSQL)' });
    return null;
  }
  if (!host || !port || !database || !username || !password) {
    res.status(400).json({ success: false, message: 'กรุณากรอก IP Server, Port, Database, Username และ Password ให้ครบ' });
    return null;
  }
  const portNumber = Number(port);
  if (!Number.isInteger(portNumber) || portNumber <= 0) {
    res.status(400).json({ success: false, message: 'Port ต้องเป็นตัวเลข' });
    return null;
  }

  return { dbType, host, port: portNumber, database, username, password };
}

// The connection details are only ever used in-memory here and are never
// included in the response.
router.post('/test-connection', async (req, res) => {
  const parsed = validateBody(req, res);
  if (!parsed) return;
  const { dbType, ...config } = parsed;

  try {
    await withConnection(dbType, config, async (conn) => {
      await conn.query('SELECT 1');
    });
    res.json({ success: true, message: 'เชื่อมต่อฐานข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(400).json({ success: false, message: `เชื่อมต่อไม่สำเร็จ: ${err.message}` });
  }
});

// Persists host/port/database/username/password server-side.
// The response never echoes those values back.
router.post('/save-connection', async (req, res) => {
  const parsed = validateBody(req, res);
  if (!parsed) return;

  try {
    saveConnectionConfig(parsed);
    res.json({ success: true, message: 'บันทึกข้อมูลการเชื่อมต่อเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(400).json({ success: false, message: `บันทึกไม่สำเร็จ: ${err.message}` });
  }
});

router.get('/status', (req, res) => {
  res.json({ configured: hasSavedConnection() });
});

module.exports = router;
