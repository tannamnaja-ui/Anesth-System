// New table for the "ใส่ท่อช่วยหายใจนอกสถานที่" tab — a table WE own,
// alongside app_anes_new_form / app_anes_postop_visit. Never touches
// existing hospital tables.
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_intubation_offsite';

const TEXT_COLUMNS = [
  'record_date',
  'time_shift',
  'diagnosis',
  'sex',
  'age',
  'bmi',
  'ward',
  'reason_for_team',
  'reason_for_team_other',
  'attempts_before_team',
  'patient_condition',
  'ward_monitor',
  'difficult_cause',
  'difficult_cause_other',
  'bag_mask_ventilation',
  'difficult_management',
  'difficult_management_other',
  'difficult',
  'drug_used',
  'drug_name',
  'success_attempts_by_team',
  'min_spo2',
  'total_intubation_time',
  'anesthesia_doctor',
  'anesthesia_nurse_1',
  'anesthesia_nurse_2',
  'note',
  'recorder',
];

const ALL_COLUMNS = ['an', 'hn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensureIntubationOffsiteTable(dbType, conn) {
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
        INDEX app_anes_intubation_offsite_an_idx (an)
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
      `CREATE INDEX IF NOT EXISTS app_anes_intubation_offsite_an_idx ON ${TABLE_NAME} (an)`
    );
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensureIntubationOffsiteTable };
