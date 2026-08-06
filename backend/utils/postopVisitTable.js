// New table for the "Postop. visit รายเคส" tab — a table WE own, created
// alongside app_anes_new_form. Never touches existing hospital tables.
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_postop_visit';

const TEXT_COLUMNS = [
  'operation_date',
  'anesth_code',
  'type_patient',
  'case_type',
  'postop_visit',
  'complication_1',
  'complication_2',
  'visitor',
  'recorder',
  'peer',
  'note',
];

const ALL_COLUMNS = ['an', 'hn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensurePostopVisitTable(dbType, conn) {
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
        INDEX app_anes_postop_visit_an_idx (an)
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
    await conn.query(`CREATE INDEX IF NOT EXISTS app_anes_postop_visit_an_idx ON ${TABLE_NAME} (an)`);
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensurePostopVisitTable };
