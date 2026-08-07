const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// When packaged with pkg, __dirname points inside the read-only snapshot
// filesystem, so config must live outside it — next to the packaged exe's
// real location (ProgramData for a machine-wide service install).
const CONFIG_DIR = process.pkg
  ? path.join(process.env.ProgramData || path.dirname(process.execPath), 'AnesthSystem')
  : path.join(__dirname, '..', 'config');

const CONFIG_PATH = path.join(CONFIG_DIR, 'connection.json');
const SESSION_SECRET_PATH = path.join(CONFIG_DIR, 'session-secret.txt');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// Connection details (host/port/database/username/password) live only in this
// server-side file. They are never sent back to the browser.
function saveConnectionConfig({ dbType, host, port, database, username, password }) {
  ensureConfigDir();
  const data = { dbType, host, port, database, username, password };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function loadConnectionConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function hasSavedConnection() {
  return fs.existsSync(CONFIG_PATH);
}

// Persisted so sessions survive a service restart instead of invalidating
// every login on every restart (which a Windows service does far more
// often than a manually-run dev server).
function getSessionSecret() {
  ensureConfigDir();
  if (fs.existsSync(SESSION_SECRET_PATH)) {
    return fs.readFileSync(SESSION_SECRET_PATH, 'utf8').trim();
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SESSION_SECRET_PATH, secret, 'utf8');
  return secret;
}

module.exports = { saveConnectionConfig, loadConnectionConfig, hasSavedConnection, getSessionSecret };
