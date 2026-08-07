import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect, DoctorSelect } from '../components/FormFields.jsx';

// Option lists transcribed verbatim from the source Google Form
// (แบบบันทึกการใส่ท่อช่วยหายใจนอกสถานที่ โรงพยาบาลหาดใหญ่).
const TIME_SHIFT_OPTIONS = ['เวรเช้าวันราชการ', 'OT1', 'OT2', 'OT3'];
const SEX_OPTIONS = ['ชาย', 'หญิง'];
const REASON_FOR_TEAM_OPTIONS = ['พยายามใส่หลายครั้ง ไม่สำเร็จ', 'มีปัญหาการแข็งตัวของเลือด', 'อื่นๆ'];
const PATIENT_CONDITION_OPTIONS = ['รู้สึกตัว ปลุกตื่น เรียกลืมตา', 'ไม่รู้สึนตัว'];
const WARD_MONITOR_OPTIONS = ['Pulse oximeter', 'EKG', 'NIBP'];
const DIFFICULT_CAUSE_OPTIONS = [
  'อ้าปากได้น้อย', 'เคลื่อนไหวคอได้น้อย', 'anterior larynx', 'Airway edema', 'ฟันยื่น', 'ลิ้นโต',
  'จัดท่าไม่เหมาะสม', 'มี Airway trauma/ เลือดออกในปาก', 'อื่นๆ',
];
const BAG_MASK_VENTILATION_OPTIONS = ['ง่าย', 'ยาก', 'ทำไม่ได้'];
const DIFFICULT_MANAGEMENT_OPTIONS = [
  'Mccoy', 'Glidescope', 'FOB', 'Quick Tracheostomy', 'Video laryngoscope', 'D blade', 'LMA', 'อื่นๆ',
];
const YES_NO_OPTIONS = ['No', 'Yes'];

const EMPTY_FORM = {
  record_date: '',
  time_shift: '',
  diagnosis: '',
  sex: '',
  age: '',
  bmi: '',
  ward: '',
  reason_for_team: '',
  reason_for_team_other: '',
  attempts_before_team: '',
  patient_condition: '',
  ward_monitor: [],
  difficult_cause: [],
  difficult_cause_other: '',
  bag_mask_ventilation: '',
  difficult_management: [],
  difficult_management_other: '',
  difficult: '',
  drug_used: '',
  drug_name: '',
  success_attempts_by_team: '',
  min_spo2: '',
  total_intubation_time: '',
  anesthesia_doctor: '',
  anesthesia_nurse_1: '',
  anesthesia_nurse_2: '',
  note: '',
  recorder: '',
};

const MULTI_SELECT_FIELDS = ['ward_monitor', 'difficult_cause', 'difficult_management'];

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

export default function IntubationOffsiteForm({ patient }) {
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
          api.getIntubationOffsite(patient.an),
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
      const res = await api.saveIntubationOffsite(payload);
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
        <h3>ใส่ท่อช่วยหายใจนอกสถานที่</h3>
        <div className="af-grid">
          <Field label="Date">
            <input type="date" value={form.record_date} onChange={(e) => set('record_date', e.target.value)} required />
          </Field>
          <TextInput label="Diagnosis" value={form.diagnosis} onChange={(v) => set('diagnosis', v)} />
          <TextInput label="Hospital number" value={hn} onChange={setHn} />
          <TextInput label="Age" value={form.age} onChange={(v) => set('age', v)} />
          <TextInput label="BMI" value={form.bmi} onChange={(v) => set('bmi', v)} />
          <TextInput label="Ward" value={form.ward} onChange={(v) => set('ward', v)} />
        </div>
        <RadioGroup label="Time" options={TIME_SHIFT_OPTIONS} value={form.time_shift} onChange={(v) => set('time_shift', v)} />
        <RadioGroup label="เพศ" options={SEX_OPTIONS} value={form.sex} onChange={(v) => set('sex', v)} />
      </section>

      <section className="af-section">
        <h3>สาเหตุที่ตามทีมวิสัญญี</h3>
        <RadioGroup label="สาเหตุที่ตามทีมวิสัญญี" options={REASON_FOR_TEAM_OPTIONS} value={form.reason_for_team} onChange={(v) => set('reason_for_team', v)} />
        <TextInput label="อื่นๆ ระบุ" value={form.reason_for_team_other} onChange={(v) => set('reason_for_team_other', v)} />
        <div className="af-grid">
          <TextInput label="จำนวนครั้งที่ Try intubation ก่อนตามทีมวิสัญญี" value={form.attempts_before_team} onChange={(v) => set('attempts_before_team', v)} />
        </div>
        <RadioGroup label="Condition of patient" options={PATIENT_CONDITION_OPTIONS} value={form.patient_condition} onChange={(v) => set('patient_condition', v)} />
        <CheckboxGroup label="Ward monitor" options={WARD_MONITOR_OPTIONS} value={form.ward_monitor} onChange={(v) => set('ward_monitor', v)} />
      </section>

      <section className="af-section">
        <h3>Difficult Airway</h3>
        <CheckboxGroup label="Cause of difficult" options={DIFFICULT_CAUSE_OPTIONS} value={form.difficult_cause} onChange={(v) => set('difficult_cause', v)} />
        <TextInput label="อื่นๆ ระบุ" value={form.difficult_cause_other} onChange={(v) => set('difficult_cause_other', v)} />
        <RadioGroup label="Bag/Face mask ventilation" options={BAG_MASK_VENTILATION_OPTIONS} value={form.bag_mask_ventilation} onChange={(v) => set('bag_mask_ventilation', v)} />
        <CheckboxGroup label="กรณี difficult" options={DIFFICULT_MANAGEMENT_OPTIONS} value={form.difficult_management} onChange={(v) => set('difficult_management', v)} />
        <TextInput label="อื่นๆ ระบุ" value={form.difficult_management_other} onChange={(v) => set('difficult_management_other', v)} />
        <div className="af-grid">
          <RadioGroup label="Difficult" options={YES_NO_OPTIONS} value={form.difficult} onChange={(v) => set('difficult', v)} />
          <RadioGroup label="Drug" options={YES_NO_OPTIONS} value={form.drug_used} onChange={(v) => set('drug_used', v)} />
          <TextInput label="กรณีใช้ยา โปรดระบุชื่อยา" value={form.drug_name} onChange={(v) => set('drug_name', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>ผลการช่วยเหลือ</h3>
        <div className="af-grid">
          <TextInput label="จำนวนครั้งที่ทีมวิสัญญีใส่สำเร็จ" value={form.success_attempts_by_team} onChange={(v) => set('success_attempts_by_team', v)} />
          <TextInput label="SpO2 ต่ำสุดขณะใส่ท่อช่วยหายใจ" value={form.min_spo2} onChange={(v) => set('min_spo2', v)} />
          <TextInput label="เวลาที่ใช้ในการ intubation โดยรวม (นาที)" value={form.total_intubation_time} onChange={(v) => set('total_intubation_time', v)} />
        </div>
        <div className="af-grid">
          <DoctorSelect label="Anesthesia doctor" value={form.anesthesia_doctor} onChange={(v) => set('anesthesia_doctor', v)} doctors={doctors} />
          <OfficerSelect label="Anesthesia nurse 1" value={form.anesthesia_nurse_1} onChange={(v) => set('anesthesia_nurse_1', v)} officers={officers} />
          <OfficerSelect label="Anesthesia nurse 2" value={form.anesthesia_nurse_2} onChange={(v) => set('anesthesia_nurse_2', v)} officers={officers} />
        </div>
        <Field label="หมายเหตุ/ปัญหาอุปสรรค">
          <textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
        <TextInput label="ผู้บันทึก" value={form.recorder} onChange={(v) => set('recorder', v)} />
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
