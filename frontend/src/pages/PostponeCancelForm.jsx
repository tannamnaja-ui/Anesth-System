import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, CheckboxGroup } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed verbatim from the source Google Form
// (แบบบันทึกการเลื่อน/งดผ่าตัด เริ่ม ก.ค 2568).
const SERVICE_OPTIONS = [
  'Gen', 'G. ped', 'CVT ทั่วไป', 'CVT open heart', 'OBS-Gyn', 'OS', 'NS', 'PS', 'Uro', 'ENT',
  'EYE', 'Maxillo', 'X ray', 'Cath lap cardio',
];
const TYPE_PATIENT_OPTIONS = ['IPD', 'OPD', 'ODS'];
const TIME_OPTIONS = ['IT', 'IT1', 'IE', 'OT'];
const ASA_OPTIONS = ['ASA 1', 'ASA2', 'ASA3', 'ASA4', 'ASA 1E', 'ASA 2E', 'ASA 3E', 'ASA 4E'];
const PREOP_VISIT_OPTIONS = ['Yes', 'No'];

const EMPTY_FORM = {
  postpone_date: '',
  operating_room: '',
  service: '',
  type_patient: [],
  time_slot: [],
  asa: [],
  preop_visit: [],
  diagnosis: '',
  reason_problem: '',
  surgeon: '',
  anesthesiologist: '',
  room_nurse: '',
  recorder: '',
};

const MULTI_SELECT_FIELDS = ['type_patient', 'time_slot', 'asa', 'preop_visit'];

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

export default function PostponeCancelForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hn, setHn] = useState(patient.hn || '');
  const [recordId, setRecordId] = useState(null);
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
        if (!caseKey) {
          setRecordId(null);
          setForm({ ...EMPTY_FORM });
          setStatus({ type: 'error', message: NO_CASE_KEY_MESSAGE });
          return;
        }
        const formRes = await api.getPostponeCancel(caseKey);
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
      const res = await api.savePostponeCancel(payload);
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
        <h3>เลื่อน/งดผ่าตัด</h3>
        <div className="af-grid">
          <Field label="วันที่เลื่อนผ่าตัด">
            <input type="date" value={form.postpone_date} onChange={(e) => set('postpone_date', e.target.value)} required />
          </Field>
          <TextInput label="HN" value={hn} onChange={setHn} />
          <TextInput label="ห้องผ่าตัด" value={form.operating_room} onChange={(v) => set('operating_room', v)} />
          <Field label="Service">
            <select value={form.service} onChange={(e) => set('service', e.target.value)}>
              <option value="">-- เลือก --</option>
              {SERVICE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <CheckboxGroup label="Type Patient" options={TYPE_PATIENT_OPTIONS} value={form.type_patient} onChange={(v) => set('type_patient', v)} />
        <CheckboxGroup label="Time" options={TIME_OPTIONS} value={form.time_slot} onChange={(v) => set('time_slot', v)} />
        <CheckboxGroup label="ASA" options={ASA_OPTIONS} value={form.asa} onChange={(v) => set('asa', v)} />
        <CheckboxGroup label="Preop visit" options={PREOP_VISIT_OPTIONS} value={form.preop_visit} onChange={(v) => set('preop_visit', v)} />

        <TextInput label="Diagnosis" value={form.diagnosis} onChange={(v) => set('diagnosis', v)} />
        <Field label="สาเหตุ/ปัญหาที่เลื่อนผ่าตัด">
          <textarea rows={3} value={form.reason_problem} onChange={(e) => set('reason_problem', e.target.value)} />
        </Field>

        <div className="af-grid">
          <TextInput label="ศัลยแพทย์" value={form.surgeon} onChange={(v) => set('surgeon', v)} />
          <TextInput label="วิสัญญีแพทย์" value={form.anesthesiologist} onChange={(v) => set('anesthesiologist', v)} />
          <TextInput label="วิสัญญีพยาบาลเจ้าของห้อง" value={form.room_nurse} onChange={(v) => set('room_nurse', v)} />
          <TextInput label="ผู้บันทึก" value={form.recorder} onChange={(v) => set('recorder', v)} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
