// New table for the "Postop. visit" tab (added alongside preop anesth
// HOSxP / Intraop / PACU) — a table WE own. Never touches existing
// hospital tables, including app_anes_postop_visit, the earlier
// "Postop. visit รายเคส" tab's table — this is a separate table by design.
// Modeled on the "Postop. visit" sheet of the referenced Google Sheet
// (แบบบันทึกการเยี่ยมผู้ป่วยหลังระงับความรู้สึกภายใน 24 ชั่วโมง / Postanesthetic visit).
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_postop_visit_new';

const TEXT_COLUMNS = [
  'postop_visit_status',
  'visit_date',
  'postop_complication',
  'complication_respiratory',
  'complication_cardiovascular',
  'complication_neuromuscular',
  'complication_hemato',
  'complication_electrolyte',
  'complication_skin_allergy',
  'complication_error',
  'complication_other',
  'peer_review',
  'anesthesia_nurse',
  'professional_nurse',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensurePostopVisitNewTable(dbType, conn) {
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
        INDEX app_anes_postop_visit_new_an_idx (an)
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
      `CREATE INDEX IF NOT EXISTS app_anes_postop_visit_new_an_idx ON ${TABLE_NAME} (an)`
    );
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensurePostopVisitNewTable };
