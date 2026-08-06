// Adds a column to an existing table if it isn't there yet. Used to evolve
// the app_anes_* tables (e.g. adding operation_set_id) without dropping or
// recreating tables that may already hold saved data.
async function ensureColumnExists(dbType, conn, tableName, columnName, columnType) {
  if (dbType === 'mysql') {
    try {
      await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
    } catch (err) {
      if (!/duplicate column/i.test(err.message)) throw err;
    }
  } else {
    await conn.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnType}`);
  }
}

module.exports = { ensureColumnExists };
