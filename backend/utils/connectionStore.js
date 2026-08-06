const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'connection.json');

// Connection details (host/port/database/username/password) live only in this
// server-side file. They are never sent back to the browser.
function saveConnectionConfig({ dbType, host, port, database, username, password }) {
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

module.exports = { saveConnectionConfig, loadConnectionConfig, hasSavedConnection };
