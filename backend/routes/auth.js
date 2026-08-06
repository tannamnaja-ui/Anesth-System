const express = require('express');
const crypto = require('crypto');
const { loadConnectionConfig } = require('../utils/connectionStore');
const { withConnection } = require('../utils/dbClient');

const router = express.Router();

function md5(text) {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

// Column names can vary in case (e.g. "Password" vs "password") depending
// on how the table was created, so look the row up case-insensitively
// instead of hardcoding a column name in the SQL text.
function getField(row, fieldName) {
  const key = Object.keys(row).find((k) => k.toLowerCase() === fieldName.toLowerCase());
  return key ? row[key] : undefined;
}

// officer's real HOSxP schema has no plain "password" column — it stores
// officer_login_password_md5 (MD5 hash) and officer_login_password
// (legacy plain text on some installs). Prefer the MD5 column.
const PASSWORD_FIELD_CANDIDATES = ['officer_login_password_md5', 'officer_login_password', 'password'];

function findStoredPassword(row) {
  for (const fieldName of PASSWORD_FIELD_CANDIDATES) {
    const value = getField(row, fieldName);
    if (value !== undefined) return { fieldName, value };
  }
  return null;
}

function passwordMatches(inputPassword, fieldName, storedPassword) {
  if (!storedPassword) return false;
  if (fieldName.toLowerCase().endsWith('_md5')) {
    return md5(inputPassword).toLowerCase() === storedPassword.toLowerCase();
  }
  if (inputPassword === storedPassword) return true;
  return md5(inputPassword).toLowerCase() === storedPassword.toLowerCase();
}

router.post('/login', async (req, res) => {
  const { username, password, department } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
  }

  const connectionConfig = loadConnectionConfig();
  if (!connectionConfig) {
    return res.status(400).json({ success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล กรุณาตั้งค่าก่อนเข้าสู่ระบบ' });
  }

  const { dbType, ...dbConfig } = connectionConfig;

  try {
    const rows = await withConnection(dbType, dbConfig, async (conn) => {
      return conn.query(
        dbType === 'mysql'
          ? 'SELECT * FROM officer WHERE officer_login_name = ? LIMIT 1'
          : 'SELECT * FROM officer WHERE officer_login_name = $1 LIMIT 1',
        [username]
      );
    });

    const officer = rows[0];
    if (!officer) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const stored = findStoredPassword(officer);
    if (!stored) {
      return res.status(500).json({
        success: false,
        message: `ไม่พบคอลัมน์รหัสผ่านในตาราง officer (คอลัมน์ที่มี: ${Object.keys(officer).join(', ')})`,
      });
    }

    if (!passwordMatches(password, stored.fieldName, stored.value)) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const loginName = getField(officer, 'officer_login_name');
    const officerName = getField(officer, 'officer_name');

    req.session.officer = {
      loginName,
      name: officerName || loginName,
      department: department || null,
    };

    res.json({ success: true, officer: req.session.officer });
  } catch (err) {
    res.status(500).json({ success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${err.message}` });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session.officer) {
    res.json({ authenticated: true, officer: req.session.officer });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
