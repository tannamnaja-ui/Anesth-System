import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed from the "Postop. visit" sheet
// (แบบบันทึกการเยี่ยมผู้ป่วยหลังระงับความรู้สึกภายใน 24 ชั่วโมง / Postanesthetic visit).
const POSTOP_VISIT_STATUS_OPTIONS = [
  'เยี่ยมที่หอผู้ป่วยและพบผู้ป่วย',
  'เยี่ยมที่หอผู้ป่วยแต่ไม่พบพบผู้ป่วย',
  'OPD case',
  'ไม่ได้เยี่ยมหลังผ่าตัด',
];
const YES_NO_OPTIONS = ['Yes', 'No'];

const EMPTY_FORM = {
  postop_visit_status: [],
  visit_date: '',
  postop_complication: '',
  complication_respiratory: '',
  complication_cardiovascular: '',
  complication_neuromuscular: '',
  complication_hemato: '',
  complication_electrolyte: '',
  complication_skin_allergy: '',
  complication_error: '',
  complication_other: '',
  peer_review: '',
  anesthesia_nurse: '',
  professional_nurse: '',
};

const MULTI_SELECT_FIELDS = ['postop_visit_status'];

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

export default function PostopVisitNewForm({ patient }) {
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
        const formRes = await api.getPostopVisitNew(caseKey);
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
      const res = await api.savePostopVisitNew(payload);
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
        <h3>Postop. visit</h3>
        <CheckboxGroup label="Postop visit" options={POSTOP_VISIT_STATUS_OPTIONS} value={form.postop_visit_status} onChange={(v) => set('postop_visit_status', v)} />
        <div className="af-grid">
          <Field label="วันที่เยี่ยมหลังผ่าตัด">
            <input type="date" value={form.visit_date} onChange={(e) => set('visit_date', e.target.value)} required />
          </Field>
          <TextInput label="HN" value={hn} onChange={setHn} />
        </div>
        <RadioGroup label="Postop. complication" options={YES_NO_OPTIONS} value={form.postop_complication} onChange={(v) => set('postop_complication', v)} />
      </section>

      <section className="af-section">
        <h3>Postop. Complication</h3>
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
        <h3>ทีมวิสัญญีเยี่ยมหลังผ่าตัด</h3>
        <RadioGroup label="Peer review" options={YES_NO_OPTIONS} value={form.peer_review} onChange={(v) => set('peer_review', v)} />
        <div className="af-grid">
          <OfficerSelect label="วิสัญญีพยาบาล" value={form.anesthesia_nurse} onChange={(v) => set('anesthesia_nurse', v)} officers={officers} />
          <OfficerSelect label="พยาบาลวิชาชีพ" value={form.professional_nurse} onChange={(v) => set('professional_nurse', v)} officers={officers} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
