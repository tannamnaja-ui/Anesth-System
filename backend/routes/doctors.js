const express = require('express');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.officer) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }
  next();
}

router.use(requireAuth);

// Read-only lookup against the existing doctor table, used to populate
// doctor-specific name dropdowns (as opposed to /officers, used for
// nurse/staff dropdowns). Only active doctors are listed.
router.get('/', async (req, res) => {
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.status(400).json({ success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล' });
  }
  const { dbType, ...dbConfig } = connectionConfig;

  try {
    const rows = await withConnection(dbType, dbConfig, (conn) =>
      conn.query("SELECT code, name FROM doctor WHERE active = 'Y' ORDER BY name")
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: `ดึงรายชื่อแพทย์ไม่สำเร็จ: ${err.message}` });
  }
});

module.exports = router;
