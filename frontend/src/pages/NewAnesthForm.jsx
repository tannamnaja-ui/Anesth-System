import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect, DoctorSelect } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed verbatim from the source Google Form
// (แบบฟอร์ม Anesthesia record และ PACU กลุ่มงานวิสัญญีวิทยา โรงพยาบาลหาดใหญ่).
const TYPE_CASE_OPTIONS = ['IT', 'IT1', 'IE', 'LT', 'ET', 'OT1', 'OT2', 'OT3'];
const ASA_OPTIONS = ['1', '2', '3', '4', '5', '6', 'E'];
const SERVICE_OPTIONS = [
  'Cath lab heart', 'CVT ทั่วไป', 'CVT open heart', 'Dental/ Maxillo', 'ENT', 'EYE', 'Gen',
  'Gen vascular', 'G.ped', 'Neuro', 'OBS/Gyne', 'Ortho', 'Plastic', 'Uro', 'Xray', 'Med', 'อื่นๆ',
];
const ROOM_OPTIONS = [
  '28. CVT', '1. Gen1', '3. Gen3', '5. Emer 1', '30. Emer2', '6. Uro1', '7. Uro2', '8. MIS',
  '9. Neuro', '10. Ortho1', '11. Ortho2', '12. Ortho3', '13. Plastic', '14. Obs1', '15. Obs2',
  '16. Obs3', '17. IVF', '18. LR', '19. ENT1', '20. ENT2', '21. EYE1', '22. EYE2', '23. Xray',
  '24. Endoscope', '25. Cath lap ชั้น 3 ตึก 10 ชั้น', '29. Intervention Neuro (IVR)',
  '32. Cath lap ชั้น 4 ตึก 10 ชั้น', '27. MRI/ CT', '31. Endoscope นาหม่อม', '32. Emer 3', 'อื่นๆ',
];
const OPERATION_OPTIONS = [
  'Appendectomy', 'C/S', 'CABG', 'OPCAB', 'Clipping aneurysm', 'Colonoscope', 'ERCP', 'EVAR',
  'TEVAR', 'Herniorrhaphy', 'Debridement', 'PLATE',
  'Laparoscopy ( ตามด้วยชื่อ operation ที่ช่อง .. อื่นๆ)',
  'Explor lap ( ตามด้วยชื่อ operation ที่ช่อง .. อื่นๆ)', 'อื่นๆ',
];
const POSITION_OPTIONS = [
  '1. Supine ( S )', '2. Prone ( P )', '3. LUD', '4. Lateral ( L )', '5. Sitting ( T )',
  '6. Trenderlenberg', '7. R. trenderlenberg', '8. Lithotomy ( H )', '9. J. knife ( J )',
  '10. Kidney ( K )', 'อื่นๆ',
];
const TECHNIQUE_OPTIONS = [
  '1. GA', '2. TIVA', '3. IVS', '4. MAC', '5. SB', '6. EB', '7. Caudal', '8. PNB',
  '9. Combined GA + RA', '10. RA then GA ( ระบุสาเหตุในช่อง " อื่นๆ " )', 'อื่นๆ',
];
const AIRWAY_MANAGEMENT_OPTIONS = [
  '1. Awake intubation', '2. Already intubation ( On Ett มาจาก ward )',
  '3. Direct laryngoscopy ( ใส่ด้วย laryngoscope blade ธรรมดา )', '4. FOB', '5. Blind intubation',
  '6. McCoy', '7. VDO laryngoscope with C mac', '8. VDO laryngoscope with Insighter',
  '9. VDO laryngoscope with Glide scope',
];
const ANESTH_TECHNIQUE_OPTIONS = [
  '1. Inhalation induction', '2. IV induction', '3. RSI', '4. Cricoid pressure', '5. Inhalation',
  '6. Balanced Technique',
];
const MEDICAL_GAS_OPTIONS = ['O2 (ออกซิเจน)', 'N2O (ไนตรัสออกไซด์)', 'Air'];
const SPECIAL_TECHNIQUE_OPTIONS = [
  '1. Low Flow ( Total flow น้อยกว่าหรือเท่ากับ 1 LPM )', '2. Hypotensive',
  '3. Cardio Pulmonary Bypass', 'อื่นๆ',
];
const AIRWAY_EQUIPMENT_OPTIONS = ['Under mask', 'Oral', 'Nasal', 'T.T'];
const TYPE_TUBE_OPTIONS = [
  '1. LMA', '2. PVC', '3. RAE', '4. MLT', '5. Double Lumen Tube ( DLT )',
  '6. Reinforced ( Armour/ Flexible tube )', '7. T.T Portex', '8. T.T Jackson', 'อื่นๆ',
];
const MONITOR_OPTIONS = ['A-line', 'CVP', 'Temperature', 'อื่นๆ'];

const EMPTY_FORM = {
  operation_date: '',
  anesth_code: '',
  sex: '',
  age: '',
  bmi: '',
  preop_visit: '',
  premed_by: '',
  type_patient: '',
  type_case: [],
  asa: [],
  association_1: '',
  association_2: '',
  association_3: '',
  association_4: '',
  association_5: '',
  service: [],
  service_other: '',
  room: '',
  room_other: '',
  diagnosis: '',
  operation_procedure: [],
  operation_procedure_other: '',
  op_duration: '',
  monitor: [],
  monitor_other: '',
  patient_position: [],
  patient_position_other: '',
  technique: [],
  technique_other: '',
  airway_management: [],
  anesth_technique: [],
  medical_gas: [],
  special_technique: [],
  special_technique_other: '',
  airway_equipment: [],
  type_tube: [],
  type_tube_other: '',
  tube_no: '',
  difficult_intubation: '',
  intraop_complication_1: '',
  intraop_complication_2: '',
  intraop_complication_3: '',
  intraop_complication_4: '',
  staff_1: '',
  staff_2: '',
  staff_3: '',
  nurse_anesth_1_1: '',
  nurse_anesth_1_2: '',
  nurse_anesth_2_1: '',
  nurse_anesth_2_2: '',
  on_ventilator_ward: '',
  rr: '',
  rr_duration: '',
  rr_complication_1: '',
  rr_complication_2: '',
  rr_complication_3: '',
  rr_complication_4: '',
  rr_nurse_1: '',
  rr_nurse_2: '',
  recorder: '',
};

const MULTI_SELECT_FIELDS = [
  'type_case', 'asa', 'service', 'operation_procedure', 'monitor', 'patient_position',
  'technique', 'airway_management', 'anesth_technique', 'medical_gas', 'special_technique',
  'airway_equipment', 'type_tube',
];

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

export default function NewAnesthForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recordId, setRecordId] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const caseKey = patient.an || patient.vn;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [officersRes, doctorsRes] = await Promise.all([api.getOfficers(), api.getDoctors()]);
        if (cancelled) return;
        setOfficers(officersRes.data);
        setDoctors(doctorsRes.data);
        if (!caseKey) {
          setRecordId(null);
          setForm({ ...EMPTY_FORM });
          setStatus({ type: 'error', message: NO_CASE_KEY_MESSAGE });
          return;
        }
        const formRes = await api.getAnesForm(caseKey);
        if (cancelled) return;
        if (formRes.data) {
          setRecordId(formRes.data.id);
          setForm(recordToFormState(formRes.data));
        } else {
          setRecordId(null);
          setForm({ ...EMPTY_FORM });
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
  }, [caseKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...formStateToPayload(form),
        id: recordId,
        an: patient.an,
        hn: patient.hn,
        vn: patient.vn,
        operation_set_id: patient.operation_set_id,
      };
      const res = await api.saveAnesForm(payload);
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
          <Field label="วันที่ผ่าตัด">
            <input
              type="date"
              value={form.operation_date}
              onChange={(e) => set('operation_date', e.target.value)}
              required
            />
          </Field>
          <TextInput label="Anesth. code" value={form.anesth_code} onChange={(v) => set('anesth_code', v)} />
          <RadioGroup label="Sex" options={['Male', 'Female']} value={form.sex} onChange={(v) => set('sex', v)} />
          <TextInput label="Age (ตัวเลข, เดือนใส่ M, วันใส่ D นำหน้า)" value={form.age} onChange={(v) => set('age', v)} />
          <TextInput label="BMI" value={form.bmi} onChange={(v) => set('bmi', v)} />
          <RadioGroup label="Preop. visit" options={['Yes', 'No']} value={form.preop_visit} onChange={(v) => set('preop_visit', v)} />
          <OfficerSelect label="Premed by" value={form.premed_by} onChange={(v) => set('premed_by', v)} officers={officers} />
          <RadioGroup
            label="Type patient"
            options={['IPD', 'OPD', 'OPD/Admit', 'ODS']}
            value={form.type_patient}
            onChange={(v) => set('type_patient', v)}
          />
        </div>
      </section>

      <section className="af-section">
        <h3>ประเภทเคส</h3>
        <CheckboxGroup label="Type case" options={TYPE_CASE_OPTIONS} value={form.type_case} onChange={(v) => set('type_case', v)} />
        <CheckboxGroup label="ASA" options={ASA_OPTIONS} value={form.asa} onChange={(v) => set('asa', v)} />
        <div className="af-grid">
          <TextInput label="Association 1" value={form.association_1} onChange={(v) => set('association_1', v)} />
          <TextInput label="Association 2" value={form.association_2} onChange={(v) => set('association_2', v)} />
          <TextInput label="Association 3" value={form.association_3} onChange={(v) => set('association_3', v)} />
          <TextInput label="Association 4" value={form.association_4} onChange={(v) => set('association_4', v)} />
          <TextInput label="Association 5" value={form.association_5} onChange={(v) => set('association_5', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>Service / Room / Diagnosis / Operation</h3>
        <CheckboxGroup label="Service" options={SERVICE_OPTIONS} value={form.service} onChange={(v) => set('service', v)} />
        <TextInput label="Service - อื่นๆ ระบุ" value={form.service_other} onChange={(v) => set('service_other', v)} />
        <div className="af-grid">
          <Field label="Room">
            <select value={form.room} onChange={(e) => set('room', e.target.value)}>
              <option value="">-- เลือก --</option>
              {ROOM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
          <TextInput label="Room - อื่นๆ ระบุ" value={form.room_other} onChange={(v) => set('room_other', v)} />
          <TextInput label="Diagnosis" value={form.diagnosis} onChange={(v) => set('diagnosis', v)} />
          <TextInput label="Op. duration" value={form.op_duration} onChange={(v) => set('op_duration', v)} />
        </div>
        <CheckboxGroup label="Operation" options={OPERATION_OPTIONS} value={form.operation_procedure} onChange={(v) => set('operation_procedure', v)} />
        <TextInput label="Operation - อื่นๆ ระบุ" value={form.operation_procedure_other} onChange={(v) => set('operation_procedure_other', v)} />
      </section>

      <section className="af-section">
        <h3>Monitor / Position / Technique</h3>
        <CheckboxGroup label="Monitor" options={MONITOR_OPTIONS} value={form.monitor} onChange={(v) => set('monitor', v)} />
        <TextInput label="Monitor - อื่นๆ ระบุ" value={form.monitor_other} onChange={(v) => set('monitor_other', v)} />
        <CheckboxGroup label="Position" options={POSITION_OPTIONS} value={form.patient_position} onChange={(v) => set('patient_position', v)} />
        <TextInput label="Position - อื่นๆ ระบุ" value={form.patient_position_other} onChange={(v) => set('patient_position_other', v)} />
        <CheckboxGroup label="Technique" options={TECHNIQUE_OPTIONS} value={form.technique} onChange={(v) => set('technique', v)} />
        <TextInput label="Technique - อื่นๆ ระบุ" value={form.technique_other} onChange={(v) => set('technique_other', v)} />
      </section>

      <section className="af-section">
        <h3>Airway / Anesthesia Technique</h3>
        <CheckboxGroup label="Airway management" options={AIRWAY_MANAGEMENT_OPTIONS} value={form.airway_management} onChange={(v) => set('airway_management', v)} />
        <CheckboxGroup label="Anesth. technique" options={ANESTH_TECHNIQUE_OPTIONS} value={form.anesth_technique} onChange={(v) => set('anesth_technique', v)} />
        <CheckboxGroup label="Medical gas" options={MEDICAL_GAS_OPTIONS} value={form.medical_gas} onChange={(v) => set('medical_gas', v)} />
        <CheckboxGroup label="Special technique" options={SPECIAL_TECHNIQUE_OPTIONS} value={form.special_technique} onChange={(v) => set('special_technique', v)} />
        <TextInput label="Special technique - อื่นๆ ระบุ" value={form.special_technique_other} onChange={(v) => set('special_technique_other', v)} />
        <CheckboxGroup label="Airway equipment" options={AIRWAY_EQUIPMENT_OPTIONS} value={form.airway_equipment} onChange={(v) => set('airway_equipment', v)} />
        <CheckboxGroup label="Type tube" options={TYPE_TUBE_OPTIONS} value={form.type_tube} onChange={(v) => set('type_tube', v)} />
        <div className="af-grid">
          <TextInput label="Type tube - อื่นๆ ระบุ" value={form.type_tube_other} onChange={(v) => set('type_tube_other', v)} />
          <TextInput label="Tube No." value={form.tube_no} onChange={(v) => set('tube_no', v)} />
          <RadioGroup label="Difficult to intubation" options={['Yes', 'No']} value={form.difficult_intubation} onChange={(v) => set('difficult_intubation', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>Intraop. Complication</h3>
        <div className="af-grid">
          <TextInput label="Intraop. Complication 1" value={form.intraop_complication_1} onChange={(v) => set('intraop_complication_1', v)} />
          <TextInput label="Intraop. Complication 2" value={form.intraop_complication_2} onChange={(v) => set('intraop_complication_2', v)} />
          <TextInput label="Intraop. Complication 3" value={form.intraop_complication_3} onChange={(v) => set('intraop_complication_3', v)} />
          <TextInput label="Intraop. Complication 4" value={form.intraop_complication_4} onChange={(v) => set('intraop_complication_4', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>ทีมผู้ปฏิบัติงาน</h3>
        <div className="af-grid">
          <DoctorSelect label="Staff 1" value={form.staff_1} onChange={(v) => set('staff_1', v)} doctors={doctors} />
          <DoctorSelect label="Staff 2" value={form.staff_2} onChange={(v) => set('staff_2', v)} doctors={doctors} />
          <DoctorSelect label="Staff 3" value={form.staff_3} onChange={(v) => set('staff_3', v)} doctors={doctors} />
          <OfficerSelect label="Nurse Anesth. 1/1" value={form.nurse_anesth_1_1} onChange={(v) => set('nurse_anesth_1_1', v)} officers={officers} />
          <OfficerSelect label="Nurse Anesth. 1/2" value={form.nurse_anesth_1_2} onChange={(v) => set('nurse_anesth_1_2', v)} officers={officers} />
          <OfficerSelect label="Nurse Anesth. 2/1" value={form.nurse_anesth_2_1} onChange={(v) => set('nurse_anesth_2_1', v)} officers={officers} />
          <OfficerSelect label="Nurse Anesth. 2/2" value={form.nurse_anesth_2_2} onChange={(v) => set('nurse_anesth_2_2', v)} officers={officers} />
        </div>
      </section>

      <section className="af-section">
        <h3>Recovery Room</h3>
        <div className="af-grid">
          <RadioGroup label="On ventilator at ward" options={['Yes', 'No']} value={form.on_ventilator_ward} onChange={(v) => set('on_ventilator_ward', v)} />
          <RadioGroup label="RR" options={['Yes', 'No']} value={form.rr} onChange={(v) => set('rr', v)} />
          <TextInput label="RR duration" value={form.rr_duration} onChange={(v) => set('rr_duration', v)} />
        </div>
        <div className="af-grid">
          <TextInput label="RR Complication 1" value={form.rr_complication_1} onChange={(v) => set('rr_complication_1', v)} />
          <TextInput label="RR Complication 2" value={form.rr_complication_2} onChange={(v) => set('rr_complication_2', v)} />
          <TextInput label="RR Complication 3" value={form.rr_complication_3} onChange={(v) => set('rr_complication_3', v)} />
          <TextInput label="RR Complication 4" value={form.rr_complication_4} onChange={(v) => set('rr_complication_4', v)} />
        </div>
        <div className="af-grid">
          <OfficerSelect label="RR Nurse 1" value={form.rr_nurse_1} onChange={(v) => set('rr_nurse_1', v)} officers={officers} />
          <OfficerSelect label="RR Nurse 2" value={form.rr_nurse_2} onChange={(v) => set('rr_nurse_2', v)} officers={officers} />
          <OfficerSelect label="ผู้บันทึก" value={form.recorder} onChange={(v) => set('recorder', v)} officers={officers} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
