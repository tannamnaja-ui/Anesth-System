import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect } from '../components/FormFields.jsx';

const TYPE_PATIENT_OPTIONS = ['IPD', 'OPD', 'OPD/ Admit', 'ODS'];
const POSTOP_VISIT_OPTIONS = ['1', '2', '3', '4', 'ODS by Phone', 'PO visit'];
const PEER_OPTIONS = ['Yes', 'Peer'];

const EMPTY_FORM = {
  operation_date: '',
  anesth_code: '',
  type_patient: '',
  case_type: '',
  postop_visit: '',
  complication_1: '',
  complication_2: '',
  visitor: '',
  recorder: '',
  peer: [],
  note: '',
};

const MULTI_SELECT_FIELDS = ['peer'];

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

export default function PostopVisitForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recordId, setRecordId] = useState(null);
  const [officers, setOfficers] = useState([]);
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
        const [officersRes, formRes] = await Promise.all([
          api.getOfficers(),
          api.getPostopVisit(patient.an),
        ]);
        if (cancelled) return;
        setOfficers(officersRes.data);
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
        hn: patient.hn,
        operation_set_id: patient.operation_set_id,
      };
      const res = await api.savePostopVisit(payload);
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
        <h3>Postop. visit รายเคส</h3>
        <div className="af-grid">
          <Field label="วันที่ผ่าตัด">
            <input
              type="date"
              value={form.operation_date}
              onChange={(e) => set('operation_date', e.target.value)}
              required
            />
          </Field>
          <TextInput label="รหัสใบดมยา" value={form.anesth_code} onChange={(v) => set('anesth_code', v)} />
        </div>
        <RadioGroup label="Type patient" options={TYPE_PATIENT_OPTIONS} value={form.type_patient} onChange={(v) => set('type_patient', v)} />
        <RadioGroup label="Case" options={TYPE_PATIENT_OPTIONS} value={form.case_type} onChange={(v) => set('case_type', v)} />
        <RadioGroup label="Postop visit" options={POSTOP_VISIT_OPTIONS} value={form.postop_visit} onChange={(v) => set('postop_visit', v)} />
        <div className="af-grid">
          <TextInput label="Complication 1" value={form.complication_1} onChange={(v) => set('complication_1', v)} />
          <TextInput label="Complication 2" value={form.complication_2} onChange={(v) => set('complication_2', v)} />
        </div>
        <div className="af-grid">
          <OfficerSelect label="ผู้เยี่ยม" value={form.visitor} onChange={(v) => set('visitor', v)} officers={officers} />
          <OfficerSelect label="ผู้บันทึก" value={form.recorder} onChange={(v) => set('recorder', v)} officers={officers} />
        </div>
        <CheckboxGroup label="Peer" options={PEER_OPTIONS} value={form.peer} onChange={(v) => set('peer', v)} />
        <Field label="หมายเหตุ">
          <textarea rows={3} value={form.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
