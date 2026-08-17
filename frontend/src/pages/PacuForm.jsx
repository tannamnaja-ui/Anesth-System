import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed from the "PACU" sheet
// (แบบบันทึกการดูแลผู้ป่วยหลังระงับความรู้สึกในห้องพักฟื้น / Post Anesthetic Care Unit).
const YES_NO_OPTIONS = ['Yes', 'NO'];
const CONSCIOUSNESS_OPTIONS = [
  'Alert/ Full conscious',
  'confusion (วุ่นวาย/สับสน)',
  'Drowsiness (ง่วง / ปลุกตื่น)',
  'Stupor (หลับลึก)',
  'Coma (ไม่รู้สึกตัว)',
  'On ETT',
];
const MOTOR_POWER_OPTIONS = ['ปกติ', 'อ่อนแรง'];
const SENSORY_LEVEL_ADMISSION_OPTIONS = ['สูงกว่า T10', 'ระดับ T10', 'ต่ำกว่า T10'];
const SENSORY_LEVEL_DISCHARGE_OPTIONS = ['สูงกว่า T11', 'ระดับ T11', 'ต่ำกว่า T11'];
const DISCHARGE_CONDITION_OPTIONS = ['On O2 cannula', 'On O2 Mask c Bag', 'On ETT (Reintubate)'];

const EMPTY_FORM = {
  pacu_status: '',
  entry_date: '',
  entry_time: '',
  exit_date: '',
  exit_time: '',
  duration: '',
  consciousness_admission: [],
  consciousness_discharge: [],
  aldrete_score_admission: '',
  aldrete_score_discharge: '',
  motor_power_admission: '',
  motor_power_discharge: '',
  sensory_level_admission: [],
  sensory_level_discharge: [],
  pain_score_admission: '',
  pain_score_discharge: '',
  pain_medication: '',
  discharge_condition: [],
  transfer_to: '',
  complication_respiratory: '',
  complication_cardiovascular: '',
  complication_neuromuscular: '',
  complication_hemato: '',
  complication_electrolyte: '',
  complication_skin_allergy: '',
  complication_error: '',
  complication_other: '',
  anesthesia_nurse_1: '',
  anesthesia_nurse_2: '',
  professional_nurse: '',
};

const MULTI_SELECT_FIELDS = [
  'consciousness_admission',
  'consciousness_discharge',
  'sensory_level_admission',
  'sensory_level_discharge',
  'discharge_condition',
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

export default function PacuForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hn, setHn] = useState(patient.hn || '');
  const [recordId, setRecordId] = useState(null);
  const [officers, setOfficers] = useState([]);
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
        const officersRes = await api.getOfficers();
        if (cancelled) return;
        setOfficers(officersRes.data);
        if (!caseKey) {
          setRecordId(null);
          setForm({ ...EMPTY_FORM });
          setStatus({ type: 'error', message: NO_CASE_KEY_MESSAGE });
          return;
        }
        const formRes = await api.getPacu(caseKey);
        if (cancelled) return;
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
        hn,
        vn: patient.vn,
        operation_set_id: patient.operation_set_id,
      };
      const res = await api.savePacu(payload);
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
        <h3>PACU</h3>
        <RadioGroup label="PACU" options={YES_NO_OPTIONS} value={form.pacu_status} onChange={(v) => set('pacu_status', v)} />
        <div className="af-grid">
          <Field label="วันที่เข้าห้องพักฟื้น">
            <input type="date" value={form.entry_date} onChange={(e) => set('entry_date', e.target.value)} required />
          </Field>
          <TextInput label="เวลาเข้า" value={form.entry_time} onChange={(v) => set('entry_time', v)} />
          <Field label="วันที่ออกจากห้องพักฟื้น">
            <input type="date" value={form.exit_date} onChange={(e) => set('exit_date', e.target.value)} />
          </Field>
          <TextInput label="เวลาออก" value={form.exit_time} onChange={(v) => set('exit_time', v)} />
          <TextInput label="ระยะเวลา" value={form.duration} onChange={(v) => set('duration', v)} />
          <TextInput label="HN" value={hn} onChange={setHn} />
        </div>
      </section>

      <section className="af-section">
        <h3>Conscious</h3>
        <CheckboxGroup label="Conscious แรกรับ" options={CONSCIOUSNESS_OPTIONS} value={form.consciousness_admission} onChange={(v) => set('consciousness_admission', v)} />
        <CheckboxGroup label="Conscious จำหน่าย" options={CONSCIOUSNESS_OPTIONS} value={form.consciousness_discharge} onChange={(v) => set('consciousness_discharge', v)} />
        <div className="af-grid">
          <TextInput label="Aldrete score แรกรับ (คะแนน)" value={form.aldrete_score_admission} onChange={(v) => set('aldrete_score_admission', v)} />
          <TextInput label="Aldrete score จำหน่าย (คะแนน)" value={form.aldrete_score_discharge} onChange={(v) => set('aldrete_score_discharge', v)} />
        </div>
        <RadioGroup label="Motor power แรกรับ" options={MOTOR_POWER_OPTIONS} value={form.motor_power_admission} onChange={(v) => set('motor_power_admission', v)} />
        <RadioGroup label="Motor power จำหน่าย" options={MOTOR_POWER_OPTIONS} value={form.motor_power_discharge} onChange={(v) => set('motor_power_discharge', v)} />
        <CheckboxGroup label="ระดับการชา แรกรับ" options={SENSORY_LEVEL_ADMISSION_OPTIONS} value={form.sensory_level_admission} onChange={(v) => set('sensory_level_admission', v)} />
        <CheckboxGroup label="ระดับการชา จำหน่าย" options={SENSORY_LEVEL_DISCHARGE_OPTIONS} value={form.sensory_level_discharge} onChange={(v) => set('sensory_level_discharge', v)} />
      </section>

      <section className="af-section">
        <h3>Pain</h3>
        <div className="af-grid">
          <TextInput label="Pain score แรกรับ" value={form.pain_score_admission} onChange={(v) => set('pain_score_admission', v)} />
          <TextInput label="Pain score จำหน่าย" value={form.pain_score_discharge} onChange={(v) => set('pain_score_discharge', v)} />
        </div>
        <TextInput label="ยาแก้ปวดที่ได้รับ" value={form.pain_medication} onChange={(v) => set('pain_medication', v)} />
      </section>

      <section className="af-section">
        <h3>สภาพจำหน่าย</h3>
        <CheckboxGroup label="สภาพจำหน่าย" options={DISCHARGE_CONDITION_OPTIONS} value={form.discharge_condition} onChange={(v) => set('discharge_condition', v)} />
        <TextInput label="Transfer to" value={form.transfer_to} onChange={(v) => set('transfer_to', v)} />
      </section>

      <section className="af-section">
        <h3>PACU Complication</h3>
        <div className="af-grid">
          <TextInput label="Respiratory" value={form.complication_respiratory} onChange={(v) => set('complication_respiratory', v)} />
          <TextInput label="Cardiovascular" value={form.complication_cardiovascular} onChange={(v) => set('complication_cardiovascular', v)} />
          <TextInput label="Neuromuscular" value={form.complication_neuromuscular} onChange={(v) => set('complication_neuromuscular', v)} />
          <TextInput label="Hemato" value={form.complication_hemato} onChange={(v) => set('complication_hemato', v)} />
          <TextInput label="Electrolyte" value={form.complication_electrolyte} onChange={(v) => set('complication_electrolyte', v)} />
          <TextInput label="Skin / allergy" value={form.complication_skin_allergy} onChange={(v) => set('complication_skin_allergy', v)} />
          <TextInput label="Error" value={form.complication_error} onChange={(v) => set('complication_error', v)} />
          <TextInput label="Other" value={form.complication_other} onChange={(v) => set('complication_other', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>ทีมผู้ปฏิบัติงาน</h3>
        <div className="af-grid">
          <OfficerSelect label="วิสัญญีพยาบาล คนที่ 1" value={form.anesthesia_nurse_1} onChange={(v) => set('anesthesia_nurse_1', v)} officers={officers} />
          <OfficerSelect label="วิสัญญีพยาบาล คนที่ 2" value={form.anesthesia_nurse_2} onChange={(v) => set('anesthesia_nurse_2', v)} officers={officers} />
          <OfficerSelect label="พยาบาลวิชาชีพ" value={form.professional_nurse} onChange={(v) => set('professional_nurse', v)} officers={officers} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
