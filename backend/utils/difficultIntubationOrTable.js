// New table for the "ใส่ท่อช่วยหายใจยากในห้องผ่าตัด" tab — a table WE own,
// alongside the other app_anes_* tables. Never touches existing hospital
// tables. Modeled on the Google Form
// "แบบบันทึกการใส่ท่อช่วยหายใจยากในห้องผ่าตัด โรงพยาบาลหาดใหญ่".
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_difficult_intubation_or';

const TEXT_COLUMNS = [
  'record_date',
  'ward',
  'service',
  'sex',
  'age',
  'bmi',
  'operation',
  'type_case',
  'mallampati_class',
  'tmd',
  'teeth',
  'radiation_burn_neck',
  'short_neck',
  'neck_motion_limit',
  'laryngoscopic_view',
  'method_mccoy_blade',
  'method_video_laryngoscope',
  'method_fiberoptic',
  'success_by',
  'success_by_other',
  'success_by_person',
  'desaturation',
  'note',
  'recorder',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensureDifficultIntubationOrTable(dbType, conn) {
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
        INDEX app_anes_difficult_intubation_or_an_idx (an)
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
      `CREATE INDEX IF NOT EXISTS app_anes_difficult_intubation_or_an_idx ON ${TABLE_NAME} (an)`
    );
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensureDifficultIntubationOrTable };
