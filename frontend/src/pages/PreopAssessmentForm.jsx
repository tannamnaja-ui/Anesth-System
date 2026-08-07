import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect, DoctorSelect } from '../components/FormFields.jsx';

// Option lists transcribed from the "assessment preop anesth HosXp" sheet
// (แบบประเมินผู้ป่วยก่อนระงับความรู้สึก / Pre-anesthetic evaluation).
// Note: the source sheet listed "OPD" twice under Type patient — treated as
// a duplicate/typo and de-duplicated here.
const TYPE_PATIENT_OPTIONS = ['IPD', 'OPD', 'OPD admit', 'ODS'];
const ASA_OPTIONS = ['1', '2', '3', '4', '5', '6', 'E'];
const CANCEL_REASON_OPTIONS = ['ทางวิสัญญี', 'ทางผู้ป่วย', 'ทางแพทย์ผ่าตัด'];
const YES_NO_TH_OPTIONS = ['ไม่มี', 'มี'];
const YES_NO_EN_OPTIONS = ['Yes', 'No'];
const NORMAL_ABNORMAL_OPTIONS = ['Normal', 'Abnormal'];
const OTHER_CONDITION_OPTIONS = ['Chemo/Radiation', 'Steroid use'];
const NECK_MOVEMENT_OPTIONS = ['No limit', 'limit'];
const AIRWAY_UNABLE_OPTIONS = ['ประเมินไม่ได้'];
const REFERRED_TYPE_OPTIONS = ['OPD', 'IPD'];

const SEX_OPTIONS = ['ชาย', 'หญิง'];

const EMPTY_FORM = {
  visit_date: '',
  visit_time: '',
  or_room: '',
  service: '',
  sex: '',
  age: '',
  ward: '',
  preop_dx: '',
  operation: '',
  type_patient: [],
  asa: [],
  cancel_reason: [],
  present_illness_history: '',
  allergy_history: '',
  allergy_detail: '',
  prior_surgery_status: '',
  prior_surgery_date: '',
  prior_surgery_anesthesia_choice: '',
  prior_surgery_complication: '',
  family_complication: '',
  smoking_cigs_per_day: '',
  smoking_years: '',
  smoking_pack_year: '',
  smoking_quit_when: '',
  alcohol_substance: '',
  alcohol_quit_when: '',
  pregnancy_weeks: '',
  other_conditions: [],
  underlying_disease: '',
  cv_system: '',
  resp_system: '',
  gi_system: '',
  urinary_system: '',
  endocrine_system: '',
  neuromuscular_system: '',
  hematologic_infection_system: '',
  miscellaneous_system: '',
  current_medications: '',
  lab_date: '',
  lab_hb: '',
  lab_hct: '',
  lab_wbc: '',
  lab_plt: '',
  lab_pt: '',
  lab_ptt: '',
  lab_inr: '',
  lab_ua: '',
  lab_na: '',
  lab_k: '',
  lab_cl: '',
  lab_hco3: '',
  lab_bun: '',
  lab_cr: '',
  lab_gfr: '',
  lab_fbs_dtx: '',
  lab_hiv: '',
  lab_hepatitis: '',
  lab_cxr: '',
  lab_ekg: '',
  lab_ct_mri: '',
  lab_echo: '',
  lab_other: '',
  blood_prc: '',
  blood_ffp: '',
  blood_pc: '',
  blood_cryoprecipitate: '',
  icu_booking: '',
  exam_bw: '',
  exam_height: '',
  exam_bmi: '',
  exam_bp: '',
  exam_hr: '',
  exam_rr: '',
  exam_bt: '',
  exam_spo2: '',
  npo_date: '',
  npo_time: '',
  gcs_e: '',
  gcs_v: '',
  gcs_m: '',
  motor_status: '',
  heent_status: '',
  respiration_status: '',
  heart_status: '',
  abdomen_status: '',
  extremities_status: '',
  mallampati_grade: '',
  tmd: '',
  fb: '',
  airway_unable_to_assess: [],
  mouth_opening_cm: '',
  dental_assessment: '',
  dentures: '',
  neck_movement: '',
  nares_patency: '',
  expected_difficult_airway: '',
  problem_list_1: '',
  problem_list_2: '',
  problem_list_3: '',
  problem_list_4: '',
  problem_list_5: '',
  problem_list_6: '',
  problem_list_7: '',
  problem_list_8: '',
  problem_list_9: '',
  problem_list_10: '',
  premedication: '',
  plan_of_anesthesia: '',
  clinic_visit_date: '',
  surgery_appointment_date: '',
  referred_department: '',
  referred_type: '',
  visit_anesthesiologist: '',
  visit_anesthesia_nurse: '',
};

const MULTI_SELECT_FIELDS = ['type_patient', 'asa', 'cancel_reason', 'other_conditions', 'airway_unable_to_assess'];

function recordToFormState(record) {
  const state = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM)) {
    if (record[key] == null) continue;
    state[key] = MULTI_SELECT_FIELDS.includes(key)
      ? String(record[key]).split(',').filter(Boolean)
      : record[key];
  }
  return state;
}

function formStateToPayload(form) {
  const payload = { ...form };
  for (const key of MULTI_SELECT_FIELDS) {
    payload[key] = (form[key] || []).join(',');
  }
  return payload;
}

export default function PreopAssessmentForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hn, setHn] = useState(patient.hn || '');
  const [recordId, setRecordId] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [officersRes, doctorsRes, formRes] = await Promise.all([
          api.getOfficers(),
          api.getDoctors(),
          api.getPreopAssessment(patient.an),
        ]);
        if (cancelled) return;
        setOfficers(officersRes.data);
        setDoctors(doctorsRes.data);
        if (formRes.data) {
          setRecordId(formRes.data.id);
          setForm(recordToFormState(formRes.data));
          setHn(formRes.data.hn || patient.hn || '');
        } else {
          setRecordId(null);
          setForm({ ...EMPTY_FORM });
          setHn(patient.hn || '');
        }
      } catch (err) {
        if (!cancelled) setStatus({ type: 'error', message: err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [patient.an]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...formStateToPayload(form),
        id: recordId,
        an: patient.an,
        hn,
        operation_set_id: patient.operation_set_id,
      };
      const res = await api.savePreopAssessment(payload);
      setRecordId(res.id);
      setStatus({ type: 'success', message: res.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="empty-hint">กำลังโหลดข้อมูล...</p>;
  }

  return (
    <form className="anes-form" onSubmit={handleSubmit}>
      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {status.message}
        </div>
      )}

      <section className="af-section">
        <h3>ข้อมูลทั่วไป</h3>
        <div className="af-grid">
          <Field label="วันที่เยี่ยม">
            <input type="date" value={form.visit_date} onChange={(e) => set('visit_date', e.target.value)} required />
          </Field>
          <TextInput label="เวลา" value={form.visit_time} onChange={(v) => set('visit_time', v)} />
          <TextInput label="HN" value={hn} onChange={setHn} />
          <TextInput label="OR Room" value={form.or_room} onChange={(v) => set('or_room', v)} />
          <TextInput label="Service" value={form.service} onChange={(v) => set('service', v)} />
          <RadioGroup label="เพศ" options={SEX_OPTIONS} value={form.sex} onChange={(v) => set('sex', v)} />
          <TextInput label="อายุ" value={form.age} onChange={(v) => set('age', v)} />
          <TextInput label="Ward" value={form.ward} onChange={(v) => set('ward', v)} />
          <TextInput label="Pre-op Dx" value={form.preop_dx} onChange={(v) => set('preop_dx', v)} />
          <TextInput label="Operation" value={form.operation} onChange={(v) => set('operation', v)} />
        </div>
        <CheckboxGroup label="Type patient" options={TYPE_PATIENT_OPTIONS} value={form.type_patient} onChange={(v) => set('type_patient', v)} />
        <CheckboxGroup label="ASA" options={ASA_OPTIONS} value={form.asa} onChange={(v) => set('asa', v)} />
        <CheckboxGroup label="งดผ่าตัดเนื่องจาก" options={CANCEL_REASON_OPTIONS} value={form.cancel_reason} onChange={(v) => set('cancel_reason', v)} />
      </section>

      <section className="af-section">
        <h3>ประวัติ</h3>
        <Field label="ประวัติการเจ็บป่วยที่มารับการผ่าตัดครั้งนี้">
          <textarea rows={2} value={form.present_illness_history} onChange={(e) => set('present_illness_history', e.target.value)} />
        </Field>
        <div className="af-grid">
          <RadioGroup label="ประวัติการแพ้ยา" options={YES_NO_TH_OPTIONS} value={form.allergy_history} onChange={(v) => set('allergy_history', v)} />
          <TextInput label="ระบุ" value={form.allergy_detail} onChange={(v) => set('allergy_detail', v)} />
        </div>
        <div className="af-grid">
          <RadioGroup label="ประวัติการผ่าตัด" options={YES_NO_TH_OPTIONS} value={form.prior_surgery_status} onChange={(v) => set('prior_surgery_status', v)} />
          <TextInput label="วัน/เดือน/ปี" value={form.prior_surgery_date} onChange={(v) => set('prior_surgery_date', v)} />
          <TextInput label="Choice of anesthesia" value={form.prior_surgery_anesthesia_choice} onChange={(v) => set('prior_surgery_anesthesia_choice', v)} />
          <TextInput label="Complication" value={form.prior_surgery_complication} onChange={(v) => set('prior_surgery_complication', v)} />
        </div>
        <RadioGroup label="ภาวะแทรกซ้อนในครอบครัว" options={YES_NO_TH_OPTIONS} value={form.family_complication} onChange={(v) => set('family_complication', v)} />
        <div className="af-grid">
          <TextInput label="ประวัติสูบบุหรี่ (มวน/วัน)" value={form.smoking_cigs_per_day} onChange={(v) => set('smoking_cigs_per_day', v)} />
          <TextInput label="ปี" value={form.smoking_years} onChange={(v) => set('smoking_years', v)} />
          <TextInput label="Pack-year" value={form.smoking_pack_year} onChange={(v) => set('smoking_pack_year', v)} />
          <TextInput label="งดเมื่อ" value={form.smoking_quit_when} onChange={(v) => set('smoking_quit_when', v)} />
          <TextInput label="สุรา/สารเสพติด" value={form.alcohol_substance} onChange={(v) => set('alcohol_substance', v)} />
          <TextInput label="งดเมื่อ" value={form.alcohol_quit_when} onChange={(v) => set('alcohol_quit_when', v)} />
          <TextInput label="Pregnancy (Wks)" value={form.pregnancy_weeks} onChange={(v) => set('pregnancy_weeks', v)} />
        </div>
        <CheckboxGroup label="อื่นๆ" options={OTHER_CONDITION_OPTIONS} value={form.other_conditions} onChange={(v) => set('other_conditions', v)} />
        <RadioGroup label="โรคประจำตัว" options={YES_NO_EN_OPTIONS} value={form.underlying_disease} onChange={(v) => set('underlying_disease', v)} />
      </section>

      <section className="af-section">
        <h3>Review of Systems</h3>
        <div className="af-grid">
          <TextInput label="Cardiovascular system" value={form.cv_system} onChange={(v) => set('cv_system', v)} />
          <TextInput label="Respiratory system" value={form.resp_system} onChange={(v) => set('resp_system', v)} />
          <TextInput label="GI system" value={form.gi_system} onChange={(v) => set('gi_system', v)} />
          <TextInput label="Urinary system" value={form.urinary_system} onChange={(v) => set('urinary_system', v)} />
          <TextInput label="Endocrine / metabolic" value={form.endocrine_system} onChange={(v) => set('endocrine_system', v)} />
          <TextInput label="Neuromuscular system" value={form.neuromuscular_system} onChange={(v) => set('neuromuscular_system', v)} />
          <TextInput label="Hematologic / Infection" value={form.hematologic_infection_system} onChange={(v) => set('hematologic_infection_system', v)} />
          <TextInput label="Miscellaneous" value={form.miscellaneous_system} onChange={(v) => set('miscellaneous_system', v)} />
        </div>
        <Field label="ยาที่ใช้อยู่ประจำ">
          <textarea rows={2} value={form.current_medications} onChange={(e) => set('current_medications', e.target.value)} />
        </Field>
      </section>

      <section className="af-section">
        <h3>Lab</h3>
        <div className="af-grid">
          <Field label="Lab วันที่">
            <input type="date" value={form.lab_date} onChange={(e) => set('lab_date', e.target.value)} />
          </Field>
          <TextInput label="CBC : Hb" value={form.lab_hb} onChange={(v) => set('lab_hb', v)} />
          <TextInput label="Hct" value={form.lab_hct} onChange={(v) => set('lab_hct', v)} />
          <TextInput label="WBC" value={form.lab_wbc} onChange={(v) => set('lab_wbc', v)} />
          <TextInput label="Plt" value={form.lab_plt} onChange={(v) => set('lab_plt', v)} />
          <TextInput label="PT" value={form.lab_pt} onChange={(v) => set('lab_pt', v)} />
          <TextInput label="PTT" value={form.lab_ptt} onChange={(v) => set('lab_ptt', v)} />
          <TextInput label="INR" value={form.lab_inr} onChange={(v) => set('lab_inr', v)} />
          <TextInput label="UA" value={form.lab_ua} onChange={(v) => set('lab_ua', v)} />
          <TextInput label="Na" value={form.lab_na} onChange={(v) => set('lab_na', v)} />
          <TextInput label="K" value={form.lab_k} onChange={(v) => set('lab_k', v)} />
          <TextInput label="Cl" value={form.lab_cl} onChange={(v) => set('lab_cl', v)} />
          <TextInput label="HCO3" value={form.lab_hco3} onChange={(v) => set('lab_hco3', v)} />
          <TextInput label="BUN" value={form.lab_bun} onChange={(v) => set('lab_bun', v)} />
          <TextInput label="Cr" value={form.lab_cr} onChange={(v) => set('lab_cr', v)} />
          <TextInput label="GFR" value={form.lab_gfr} onChange={(v) => set('lab_gfr', v)} />
          <TextInput label="FBS/DTX" value={form.lab_fbs_dtx} onChange={(v) => set('lab_fbs_dtx', v)} />
          <TextInput label="HIV" value={form.lab_hiv} onChange={(v) => set('lab_hiv', v)} />
          <TextInput label="Hepatitis" value={form.lab_hepatitis} onChange={(v) => set('lab_hepatitis', v)} />
          <TextInput label="CXR" value={form.lab_cxr} onChange={(v) => set('lab_cxr', v)} />
          <TextInput label="EKG" value={form.lab_ekg} onChange={(v) => set('lab_ekg', v)} />
          <TextInput label="CT/MRI" value={form.lab_ct_mri} onChange={(v) => set('lab_ct_mri', v)} />
          <TextInput label="ECHO" value={form.lab_echo} onChange={(v) => set('lab_echo', v)} />
          <TextInput label="Other" value={form.lab_other} onChange={(v) => set('lab_other', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>Pre-op Blood & Component / ICU</h3>
        <div className="af-grid">
          <TextInput label="PRC" value={form.blood_prc} onChange={(v) => set('blood_prc', v)} />
          <TextInput label="FFP" value={form.blood_ffp} onChange={(v) => set('blood_ffp', v)} />
          <TextInput label="PC" value={form.blood_pc} onChange={(v) => set('blood_pc', v)} />
          <TextInput label="Cryoprecipitate" value={form.blood_cryoprecipitate} onChange={(v) => set('blood_cryoprecipitate', v)} />
        </div>
        <RadioGroup label="จอง ICU" options={YES_NO_TH_OPTIONS} value={form.icu_booking} onChange={(v) => set('icu_booking', v)} />
      </section>

      <section className="af-section">
        <h3>ตรวจร่างกาย</h3>
        <div className="af-grid">
          <TextInput label="BW" value={form.exam_bw} onChange={(v) => set('exam_bw', v)} />
          <TextInput label="Height" value={form.exam_height} onChange={(v) => set('exam_height', v)} />
          <TextInput label="BMI" value={form.exam_bmi} onChange={(v) => set('exam_bmi', v)} />
          <TextInput label="BP" value={form.exam_bp} onChange={(v) => set('exam_bp', v)} />
          <TextInput label="HR" value={form.exam_hr} onChange={(v) => set('exam_hr', v)} />
          <TextInput label="RR" value={form.exam_rr} onChange={(v) => set('exam_rr', v)} />
          <TextInput label="BT" value={form.exam_bt} onChange={(v) => set('exam_bt', v)} />
          <TextInput label="SpO2" value={form.exam_spo2} onChange={(v) => set('exam_spo2', v)} />
          <Field label="NPO date">
            <input type="date" value={form.npo_date} onChange={(e) => set('npo_date', e.target.value)} />
          </Field>
          <TextInput label="NPO time" value={form.npo_time} onChange={(v) => set('npo_time', v)} />
          <TextInput label="GCS: E" value={form.gcs_e} onChange={(v) => set('gcs_e', v)} />
          <TextInput label="GCS: V" value={form.gcs_v} onChange={(v) => set('gcs_v', v)} />
          <TextInput label="GCS: M" value={form.gcs_m} onChange={(v) => set('gcs_m', v)} />
        </div>
        <RadioGroup label="Motor" options={NORMAL_ABNORMAL_OPTIONS} value={form.motor_status} onChange={(v) => set('motor_status', v)} />
        <RadioGroup label="HEENT" options={NORMAL_ABNORMAL_OPTIONS} value={form.heent_status} onChange={(v) => set('heent_status', v)} />
        <RadioGroup label="Respiration" options={NORMAL_ABNORMAL_OPTIONS} value={form.respiration_status} onChange={(v) => set('respiration_status', v)} />
        <RadioGroup label="Heart" options={NORMAL_ABNORMAL_OPTIONS} value={form.heart_status} onChange={(v) => set('heart_status', v)} />
        <RadioGroup label="Abdomen" options={NORMAL_ABNORMAL_OPTIONS} value={form.abdomen_status} onChange={(v) => set('abdomen_status', v)} />
        <RadioGroup label="Extremities" options={NORMAL_ABNORMAL_OPTIONS} value={form.extremities_status} onChange={(v) => set('extremities_status', v)} />
      </section>

      <section className="af-section">
        <h3>Airway</h3>
        <div className="af-grid">
          <TextInput label="Mallampati gr." value={form.mallampati_grade} onChange={(v) => set('mallampati_grade', v)} />
          <TextInput label="TMD" value={form.tmd} onChange={(v) => set('tmd', v)} />
          <TextInput label="FB" value={form.fb} onChange={(v) => set('fb', v)} />
        </div>
        <CheckboxGroup label="" options={AIRWAY_UNABLE_OPTIONS} value={form.airway_unable_to_assess} onChange={(v) => set('airway_unable_to_assess', v)} />
        <div className="af-grid">
          <TextInput label="Mouth opening (cm)" value={form.mouth_opening_cm} onChange={(v) => set('mouth_opening_cm', v)} />
          <TextInput label="Dental assessment" value={form.dental_assessment} onChange={(v) => set('dental_assessment', v)} />
        </div>
        <RadioGroup label="ฟันปลอม" options={YES_NO_TH_OPTIONS} value={form.dentures} onChange={(v) => set('dentures', v)} />
        <RadioGroup label="Neck movement" options={NECK_MOVEMENT_OPTIONS} value={form.neck_movement} onChange={(v) => set('neck_movement', v)} />
        <RadioGroup label="Patency of nares" options={NORMAL_ABNORMAL_OPTIONS} value={form.nares_patency} onChange={(v) => set('nares_patency', v)} />
        <RadioGroup label="Expected difficult airway" options={YES_NO_TH_OPTIONS} value={form.expected_difficult_airway} onChange={(v) => set('expected_difficult_airway', v)} />
      </section>

      <section className="af-section">
        <h3>Problem List</h3>
        <div className="af-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <TextInput
              key={n}
              label={`${n}.`}
              value={form[`problem_list_${n}`]}
              onChange={(v) => set(`problem_list_${n}`, v)}
            />
          ))}
        </div>
      </section>

      <section className="af-section">
        <h3>Plan</h3>
        <TextInput label="Premedication" value={form.premedication} onChange={(v) => set('premedication', v)} />
        <Field label="Plan of Anesthesia">
          <textarea rows={2} value={form.plan_of_anesthesia} onChange={(e) => set('plan_of_anesthesia', e.target.value)} />
        </Field>
      </section>

      <section className="af-section">
        <h3>Preanesthetic Clinic</h3>
        <div className="af-grid">
          <Field label="Preanesthetic Clinic วันที่">
            <input type="date" value={form.clinic_visit_date} onChange={(e) => set('clinic_visit_date', e.target.value)} />
          </Field>
          <Field label="วันที่นัดผ่าตัด">
            <input type="date" value={form.surgery_appointment_date} onChange={(e) => set('surgery_appointment_date', e.target.value)} />
          </Field>
          <TextInput label="ส่งจากแผนก" value={form.referred_department} onChange={(v) => set('referred_department', v)} />
        </div>
        <RadioGroup label="" options={REFERRED_TYPE_OPTIONS} value={form.referred_type} onChange={(v) => set('referred_type', v)} />
        <div className="af-grid">
          <DoctorSelect label="ทีมวิสัญญีเยี่ยมก่อนผ่าตัด - วิสัญญีแพทย์" value={form.visit_anesthesiologist} onChange={(v) => set('visit_anesthesiologist', v)} doctors={doctors} />
          <OfficerSelect label="วิสัญญีพยาบาล" value={form.visit_anesthesia_nurse} onChange={(v) => set('visit_anesthesia_nurse', v)} officers={officers} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
