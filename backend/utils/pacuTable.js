// New table for the "PACU" tab — a table WE own, alongside the other
// app_anes_* tables. Never touches existing hospital tables.
// Modeled on the "PACU" sheet of the referenced Google Sheet
// (แบบบันทึกการดูแลผู้ป่วยหลังระงับความรู้สึกในห้องพักฟื้น / Post Anesthetic Care Unit).
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_pacu';

const TEXT_COLUMNS = [
  'pacu_status',
  'entry_date',
  'entry_time',
  'exit_date',
  'exit_time',
  'duration',
  'consciousness_admission',
  'consciousness_discharge',
  'aldrete_score_admission',
  'aldrete_score_discharge',
  'motor_power_admission',
  'motor_power_discharge',
  'sensory_level_admission',
  'sensory_level_discharge',
  'pain_score_admission',
  'pain_score_discharge',
  'pain_medication',
  'discharge_condition',
  'transfer_to',
  'complication_respiratory',
  'complication_cardiovascular',
  'complication_neuromuscular',
  'complication_hemato',
  'complication_electrolyte',
  'complication_skin_allergy',
  'complication_error',
  'complication_other',
  'anesthesia_nurse_1',
  'anesthesia_nurse_2',
  'professional_nurse',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensurePacuTable(dbType, conn) {
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
        INDEX app_anes_pacu_an_idx (an)
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
    await conn.query(`CREATE INDEX IF NOT EXISTS app_anes_pacu_an_idx ON ${TABLE_NAME} (an)`);
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensurePacuTable };
