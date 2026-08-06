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

// Read-only lookup against the existing officer table, used to populate
// staff/nurse name dropdowns. Never writes to officer.
router.get('/', async (req, res) => {
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.status(400).json({ success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล' });
  }
  const { dbType, ...dbConfig } = connectionConfig;

  try {
    const rows = await withConnection(dbType, dbConfig, (conn) =>
      conn.query('SELECT officer_id, officer_name FROM officer ORDER BY officer_name')
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: `ดึงรายชื่อเจ้าหน้าที่ไม่สำเร็จ: ${err.message}` });
  }
});

module.exports = router;
