// New table for the "New Anesth new form" tab. This is a table WE own —
// it must never touch existing hospital tables (officer, operation_set, ...).
// Table/column names are all lowercase per project convention.
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_new_form';

// Columns beyond id/an/hn/created_by/created_at/updated_at — all stored as
// free text, including comma-joined values for the checkbox-group fields.
const TEXT_COLUMNS = [
  'operation_date',
  'anesth_code',
  'sex',
  'age',
  'bmi',
  'preop_visit',
  'premed_by',
  'type_patient',
  'type_case',
  'asa',
  'association_1',
  'association_2',
  'association_3',
  'association_4',
  'association_5',
  'service',
  'service_other',
  'room',
  'room_other',
  'diagnosis',
  'operation_procedure',
  'operation_procedure_other',
  'op_duration',
  'monitor',
  'monitor_other',
  'patient_position',
  'patient_position_other',
  'technique',
  'technique_other',
  'airway_management',
  'anesth_technique',
  'medical_gas',
  'special_technique',
  'special_technique_other',
  'airway_equipment',
  'type_tube',
  'type_tube_other',
  'tube_no',
  'difficult_intubation',
  'intraop_complication_1',
  'intraop_complication_2',
  'intraop_complication_3',
  'intraop_complication_4',
  'staff_1',
  'staff_2',
  'staff_3',
  'nurse_anesth_1_1',
  'nurse_anesth_1_2',
  'nurse_anesth_2_1',
  'nurse_anesth_2_2',
  'on_ventilator_ward',
  'rr',
  'rr_duration',
  'rr_complication_1',
  'rr_complication_2',
  'rr_complication_3',
  'rr_complication_4',
  'rr_nurse_1',
  'rr_nurse_2',
  'recorder',
];

// an/hn/vn/operation_set_id link back to the operation_set record
// (read-only reference — no foreign key, since we never modify the
// existing schema). Not every case has an AN yet (e.g. still "รอการเปิด
// Visit"), so VN is kept as a fallback identifier.
const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensureAnesFormTable(dbType, conn) {
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
        INDEX app_anes_new_form_an_idx (an)
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
    await conn.query(`CREATE INDEX IF NOT EXISTS app_anes_new_form_an_idx ON ${TABLE_NAME} (an)`);
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensureAnesFormTable };
