// New table for the "เลื่อน/งดผ่าตัด" tab — a table WE own, alongside
// the other app_anes_* tables. Never touches existing hospital tables.
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_postpone_cancel';

const TEXT_COLUMNS = [
  'postpone_date',
  'operating_room',
  'service',
  'type_patient',
  'time_slot',
  'asa',
  'preop_visit',
  'diagnosis',
  'reason_problem',
  'surgeon',
  'anesthesiologist',
  'room_nurse',
  'recorder',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensurePostponeCancelTable(dbType, conn) {
  if (ensured) return;

  if (dbType === 'mysql') {
    const columns = TEXT_COLUMNS.map((c) => `${c} TEXT`).join(',\n      ');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        an VARCHAR(50),
        hn VARCHAR(50),
        ${columns},
        created_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX app_anes_postpone_cancel_an_idx (an)
      )
    `);
  } else {
    const columns = TEXT_COLUMNS.map((c) => `${c} text`).join(',\n      ');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id serial PRIMARY KEY,
        an varchar(50),
        hn varchar(50),
        ${columns},
        created_by text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await conn.query(
      `CREATE INDEX IF NOT EXISTS app_anes_postpone_cancel_an_idx ON ${TABLE_NAME} (an)`
    );
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensurePostponeCancelTable };
