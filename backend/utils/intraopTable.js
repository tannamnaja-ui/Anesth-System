// New table for the "Intraop" tab — a table WE own, alongside the other
// app_anes_* tables. Never touches existing hospital tables.
// Modeled on the "Intraop" sheet of the referenced Google Sheet
// (แบบบันทึกผู้ป่วยระหว่างระงับความรู้สึก / Intra-anesthetic phase).
// Several fields in that sheet (Position, Airway management/equipment,
// Type tube, Monitor, induction/maintenance technique, etc.) had no
// discoverable checkbox/dropdown option list — those are stored as free
// text here rather than guessing at options.
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_intraop';

const TEXT_COLUMNS = [
  'start_date',
  'start_time',
  'finish_date',
  'finish_time',
  'duration_hours',
  'duration_minutes',
  'or_room',
  'post_dx',
  'operation',
  'asa_intraop',
  'service_period',
  'position',
  'anesth_technique',
  'airway_management',
  'airway_equipment',
  'airway_equipment_ga',
  'type_tube',
  'tube_no',
  'tube_cuff',
  'difficult_intubation',
  'special_technique',
  'monitor',
  'anesth_technique_induction',
  'induction_agent',
  'intubation_agent',
  'anesth_technique_maintenance',
  'muscle_relaxant',
  'medical_gas',
  'inhale',
  'narcotic',
  'local_agent',
  'estimate_blood_loss_ml',
  'complication_respiratory',
  'complication_cardiovascular',
  'complication_neuromuscular',
  'complication_hemato',
  'complication_electrolyte',
  'complication_skin_allergy',
  'complication_error',
  'complication_other',
  'on_ventilator_ward',
  'transfer_to',
  'anesthesiologist_1',
  'anesthesiologist_2',
  'anesthesia_nurse_1',
  'anesthesia_nurse_2',
  'anesthesia_nurse_3',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensureIntraopTable(dbType, conn) {
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
        INDEX app_anes_intraop_an_idx (an)
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
    await conn.query(`CREATE INDEX IF NOT EXISTS app_anes_intraop_an_idx ON ${TABLE_NAME} (an)`);
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensureIntraopTable };
