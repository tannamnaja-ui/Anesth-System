const express = require('express');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');
const {
  TABLE_NAME,
  ALL_COLUMNS,
  ensurePostponeCancelTable,
} = require('../utils/postponeCancelTable');

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.officer) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
  }
  next();
}

router.use(requireAuth);

function getDbConfigOrFail(res) {
  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    res.status(400).json({ success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล' });
    return null;
  }
  const { dbType, ...dbConfig } = connectionConfig;
  return { dbType, dbConfig };
}

// Latest saved record for this AN, if any.
router.get('/record/:key', async (req, res) => {
  const target = getDbConfigOrFail(res);
  if (!target) return;
  const { dbType, dbConfig } = target;

  try {
    const row = await withConnection(dbType, dbConfig, async (conn) => {
      await ensurePostponeCancelTable(dbType, conn);
      const rows = await conn.query(
        dbType === 'mysql'
          ? `SELECT * FROM ${TABLE_NAME} WHERE an = ? OR vn = ? ORDER BY id DESC LIMIT 1`
          : `SELECT * FROM ${TABLE_NAME} WHERE an = $1 OR vn = $2 ORDER BY id DESC LIMIT 1`,
        [req.params.key, req.params.key]
      );
      return rows[0] || null;
    });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: `โหลดข้อมูลไม่สำเร็จ: ${err.message}` });
  }
});

// Creates a new record, or updates the existing one when `id` is supplied.
router.post('/record', async (req, res) => {
  const target = getDbConfigOrFail(res);
  if (!target) return;
  const { dbType, dbConfig } = target;

  const { id, an, hn, vn, ...rest } = req.body;
  if (!an && !vn) {
    return res.status(400).json({ success: false, message: 'ไม่พบเลข AN หรือ VN ของผู้ป่วย' });
  }

  const values = { an: an || null, hn: hn || null, vn: vn || null };
  for (const col of ALL_COLUMNS) {
    if (col === 'an' || col === 'hn' || col === 'vn' || col === 'created_by') continue;
    values[col] = rest[col] ?? null;
  }
  values.created_by = req.session.officer.loginName;

  try {
    const result = await withConnection(dbType, dbConfig, async (conn) => {
      await ensurePostponeCancelTable(dbType, conn);

      const columns = Object.keys(values);
      const placeholder = (i) => (dbType === 'mysql' ? '?' : `$${i + 1}`);

      if (id) {
        const setClause = columns.map((col, i) => `${col} = ${placeholder(i)}`).join(', ');
        const updatedAtClause = dbType === 'mysql' ? '' : ', updated_at = now()';
        const idPlaceholder = dbType === 'mysql' ? '?' : `$${columns.length + 1}`;
        await conn.query(
          `UPDATE ${TABLE_NAME} SET ${setClause}${updatedAtClause} WHERE id = ${idPlaceholder}`,
          [...columns.map((col) => values[col]), id]
        );
        return { id };
      }

      const columnList = columns.join(', ');
      const placeholders = columns.map((_, i) => placeholder(i)).join(', ');
      if (dbType === 'mysql') {
        const insertResult = await conn.query(
          `INSERT INTO ${TABLE_NAME} (${columnList}) VALUES (${placeholders})`,
          columns.map((col) => values[col])
        );
        return { id: insertResult.insertId };
      }
      const inserted = await conn.query(
        `INSERT INTO ${TABLE_NAME} (${columnList}) VALUES (${placeholders}) RETURNING id`,
        columns.map((col) => values[col])
      );
      return { id: inserted[0].id };
    });

    res.json({ success: true, id: result.id, message: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: `บันทึกข้อมูลไม่สำเร็จ: ${err.message}` });
  }
});

module.exports = router;
