import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed from the source Google Form
// (แบบบันทึกการใส่ท่อช่วยหายใจยากในห้องผ่าตัด โรงพยาบาลหาดใหญ่).
const SEX_OPTIONS = ['male', 'Female'];
const TYPE_CASE_OPTIONS = ['Elective', 'Emergency'];
const MALLAMPATI_OPTIONS = ['class 1', 'class 2', 'class 3', 'class 4'];
const TMD_OPTIONS = ['น้อยกว่า 3 FB', 'มากกว่า 3 FB'];
const YES_NO_OPTIONS = ['Yes', 'No'];
const LARYNGOSCOPIC_VIEW_OPTIONS = ['class 1', 'class 2', 'class 3', 'class 4'];
const ATTEMPT_OPTIONS = ['1 attempts', '2 attempts', '3 attempts', 'มากกว่า 3 attempts'];
const SUCCESS_BY_OPTIONS = ['Mc Coy blade', 'Video laryngoscope', 'Fiber optic', 'อื่นๆ'];

const EMPTY_FORM = {
  record_date: '',
  ward: '',
  service: '',
  sex: '',
  age: '',
  bmi: '',
  operation: '',
  type_case: '',
  mallampati_class: '',
  tmd: '',
  teeth: '',
  radiation_burn_neck: '',
  short_neck: '',
  neck_motion_limit: '',
  laryngoscopic_view: '',
  method_mccoy_blade: [],
  method_video_laryngoscope: [],
  method_fiberoptic: [],
  success_by: '',
  success_by_other: '',
  success_by_person: '',
  desaturation: '',
  note: '',
  recorder: '',
};

const MULTI_SELECT_FIELDS = ['method_mccoy_blade', 'method_video_laryngoscope', 'method_fiberoptic'];

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

export default function DifficultIntubationOrForm({ patient }) {
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
        const formRes = await api.getDifficultIntubationOr(caseKey);
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
      const res = await api.saveDifficultIntubationOr(payload);
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
        <h3>ใส่ท่อช่วยหายใจยากในห้องผ่าตัด</h3>
        <div className="af-grid">
          <Field label="วันที่">
            <input type="date" value={form.record_date} onChange={(e) => set('record_date', e.target.value)} required />
          </Field>
          <TextInput label="HN" value={hn} onChange={setHn} />
          <TextInput label="Ward" value={form.ward} onChange={(v) => set('ward', v)} />
          <TextInput label="Service" value={form.service} onChange={(v) => set('service', v)} />
          <TextInput label="Age" value={form.age} onChange={(v) => set('age', v)} />
          <TextInput label="BMI" value={form.bmi} onChange={(v) => set('bmi', v)} />
          <TextInput label="Operation" value={form.operation} onChange={(v) => set('operation', v)} />
        </div>
        <RadioGroup label="Sex" options={SEX_OPTIONS} value={form.sex} onChange={(v) => set('sex', v)} />
        <RadioGroup label="Type case" options={TYPE_CASE_OPTIONS} value={form.type_case} onChange={(v) => set('type_case', v)} />
      </section>

      <section className="af-section">
        <h3>Airway Assessment</h3>
        <RadioGroup label="Mallampati class" options={MALLAMPATI_OPTIONS} value={form.mallampati_class} onChange={(v) => set('mallampati_class', v)} />
        <RadioGroup label="Thyromental Distance / TMD" options={TMD_OPTIONS} value={form.tmd} onChange={(v) => set('tmd', v)} />
        <TextInput label="Teeth" value={form.teeth} onChange={(v) => set('teeth', v)} />
        <RadioGroup label="Radiation or Burn at neck" options={YES_NO_OPTIONS} value={form.radiation_burn_neck} onChange={(v) => set('radiation_burn_neck', v)} />
        <RadioGroup label="Short neck" options={YES_NO_OPTIONS} value={form.short_neck} onChange={(v) => set('short_neck', v)} />
        <RadioGroup label="Neck motion limit" options={YES_NO_OPTIONS} value={form.neck_motion_limit} onChange={(v) => set('neck_motion_limit', v)} />
        <RadioGroup label="Laryngoscopic view" options={LARYNGOSCOPIC_VIEW_OPTIONS} value={form.laryngoscopic_view} onChange={(v) => set('laryngoscopic_view', v)} />
      </section>

      <section className="af-section">
        <h3>Method (จำนวนครั้งที่ลองแต่ละวิธี)</h3>
        <CheckboxGroup label="Mc Coy blade" options={ATTEMPT_OPTIONS} value={form.method_mccoy_blade} onChange={(v) => set('method_mccoy_blade', v)} />
        <CheckboxGroup label="Video laryngoscope" options={ATTEMPT_OPTIONS} value={form.method_video_laryngoscope} onChange={(v) => set('method_video_laryngoscope', v)} />
        <CheckboxGroup label="Fiberoptic" options={ATTEMPT_OPTIONS} value={form.method_fiberoptic} onChange={(v) => set('method_fiberoptic', v)} />
      </section>

      <section className="af-section">
        <h3>ผลลัพธ์</h3>
        <RadioGroup label="Success by / ใส่สำเร็จด้วยวิธีใด" options={SUCCESS_BY_OPTIONS} value={form.success_by} onChange={(v) => set('success_by', v)} />
        <TextInput label="อื่นๆ ระบุ" value={form.success_by_other} onChange={(v) => set('success_by_other', v)} />
        <div className="af-grid">
          <TextInput label="ใส่สำเร็จโดยใคร" value={form.success_by_person} onChange={(v) => set('success_by_person', v)} />
        </div>
        <RadioGroup label="Desaturation" options={YES_NO_OPTIONS} value={form.desaturation} onChange={(v) => set('desaturation', v)} />
        <Field label="หมายเหตุ">
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
