// New table for the "preop anesth HOSxP" tab — a table WE own, alongside
// the other app_anes_* tables. Never touches existing hospital tables
// (including app_anes_preop_assessment, the earlier "Preop Anesth" tab's
// table — this is a separate table by design).
// Modeled on the "assessment preop anesth HosXp" sheet of the referenced
// Google Sheet (แบบประเมินผู้ป่วยก่อนระงับความรู้สึก / Pre-anesthetic evaluation).
const { ensureColumnExists } = require('./schemaHelpers');

const TABLE_NAME = 'app_anes_preop_hosxp';

const TEXT_COLUMNS = [
  'visit_date',
  'visit_time',
  'or_room',
  'service',
  'sex',
  'age',
  'ward',
  'preop_dx',
  'operation',
  'type_patient',
  'asa',
  'cancel_reason',
  'present_illness_history',
  'allergy_history',
  'allergy_detail',
  'prior_surgery_status',
  'prior_surgery_date',
  'prior_surgery_anesthesia_choice',
  'prior_surgery_complication',
  'family_complication',
  'smoking_cigs_per_day',
  'smoking_years',
  'smoking_pack_year',
  'smoking_quit_when',
  'alcohol_substance',
  'alcohol_quit_when',
  'pregnancy_weeks',
  'other_conditions',
  'underlying_disease',
  'cv_system',
  'resp_system',
  'gi_system',
  'urinary_system',
  'endocrine_system',
  'neuromuscular_system',
  'hematologic_infection_system',
  'miscellaneous_system',
  'current_medications',
  'lab_date',
  'lab_hb',
  'lab_hct',
  'lab_wbc',
  'lab_plt',
  'lab_pt',
  'lab_ptt',
  'lab_inr',
  'lab_ua',
  'lab_na',
  'lab_k',
  'lab_cl',
  'lab_hco3',
  'lab_bun',
  'lab_cr',
  'lab_gfr',
  'lab_fbs_dtx',
  'lab_hiv',
  'lab_hepatitis',
  'lab_cxr',
  'lab_ekg',
  'lab_ct_mri',
  'lab_echo',
  'lab_other',
  'blood_prc',
  'blood_ffp',
  'blood_pc',
  'blood_cryoprecipitate',
  'icu_booking',
  'exam_bw',
  'exam_height',
  'exam_bmi',
  'exam_bp',
  'exam_hr',
  'exam_rr',
  'exam_bt',
  'exam_spo2',
  'npo_date',
  'npo_time',
  'gcs_e',
  'gcs_v',
  'gcs_m',
  'motor_status',
  'heent_status',
  'respiration_status',
  'heart_status',
  'abdomen_status',
  'extremities_status',
  'mallampati_grade',
  'tmd',
  'fb',
  'airway_unable_to_assess',
  'mouth_opening_cm',
  'dental_assessment',
  'dentures',
  'neck_movement',
  'nares_patency',
  'expected_difficult_airway',
  'problem_list_1',
  'problem_list_2',
  'problem_list_3',
  'problem_list_4',
  'problem_list_5',
  'problem_list_6',
  'problem_list_7',
  'problem_list_8',
  'problem_list_9',
  'problem_list_10',
  'premedication',
  'plan_of_anesthesia',
  'clinic_visit_date',
  'surgery_appointment_date',
  'referred_department',
  'referred_type',
  'visit_anesthesiologist',
  'visit_anesthesia_nurse',
];

const ALL_COLUMNS = ['an', 'hn', 'vn', 'operation_set_id', ...TEXT_COLUMNS, 'created_by'];

let ensured = false;

async function ensurePreopAnesthHosxpTable(dbType, conn) {
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
        INDEX app_anes_preop_hosxp_an_idx (an)
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
      `CREATE INDEX IF NOT EXISTS app_anes_preop_hosxp_an_idx ON ${TABLE_NAME} (an)`
    );
  }

  await ensureColumnExists(dbType, conn, TABLE_NAME, 'operation_set_id', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');
  await ensureColumnExists(dbType, conn, TABLE_NAME, 'vn', dbType === 'mysql' ? 'VARCHAR(50)' : 'varchar(50)');

  ensured = true;
}

module.exports = { TABLE_NAME, ALL_COLUMNS, ensurePreopAnesthHosxpTable };
