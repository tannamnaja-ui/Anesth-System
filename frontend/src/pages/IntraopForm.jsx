import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Field, TextInput, RadioGroup, CheckboxGroup, OfficerSelect, DoctorSelect } from '../components/FormFields.jsx';
import { NO_CASE_KEY_MESSAGE } from '../utils/messages.js';

// Option lists transcribed from the "Intraop" sheet
// (แบบบันทึกผู้ป่วยระหว่างระงับความรู้สึก / Intra-anesthetic phase).
// Several fields in that sheet (Position, Airway management/equipment, Type
// tube, Monitor, induction/maintenance technique, etc.) had no discoverable
// checkbox/dropdown option list in the sheet — those are plain text inputs
// here rather than guessing at options.
const ASA_OPTIONS = ['1', '2', '3', '4', '5', '6', 'E'];
const MUSCLE_RELAXANT_OPTIONS = ['CISATRACURIUM', 'ROCURONIUM'];
const MEDICAL_GAS_OPTIONS = ['Oxygen', 'N2O', 'Air'];
const INHALE_OPTIONS = ['SEVOFURANE', 'DESFURANE'];
const NARCOTIC_OPTIONS = ['MO', 'FENTANYL', 'PETHIDINE', 'NULBUPHINE'];
const LOCAL_AGENT_OPTIONS = ['0.5% H. MARCAINE', '0.5% ISO MARCAINE', '0.5% P. MARCAINE', 'LIDOCAINE'];
const YES_NO_OPTIONS = ['Yes', 'No'];

const EMPTY_FORM = {
  start_date: '',
  start_time: '',
  finish_date: '',
  finish_time: '',
  duration_hours: '',
  duration_minutes: '',
  or_room: '',
  post_dx: '',
  operation: '',
  asa_intraop: [],
  service_period: '',
  position: '',
  anesth_technique: '',
  airway_management: '',
  airway_equipment: '',
  airway_equipment_ga: '',
  type_tube: '',
  tube_no: '',
  tube_cuff: '',
  difficult_intubation: '',
  special_technique: '',
  monitor: '',
  anesth_technique_induction: '',
  induction_agent: '',
  intubation_agent: '',
  anesth_technique_maintenance: '',
  muscle_relaxant: [],
  medical_gas: [],
  inhale: [],
  narcotic: [],
  local_agent: [],
  estimate_blood_loss_ml: '',
  complication_respiratory: '',
  complication_cardiovascular: '',
  complication_neuromuscular: '',
  complication_hemato: '',
  complication_electrolyte: '',
  complication_skin_allergy: '',
  complication_error: '',
  complication_other: '',
  on_ventilator_ward: '',
  transfer_to: '',
  anesthesiologist_1: '',
  anesthesiologist_2: '',
  anesthesia_nurse_1: '',
  anesthesia_nurse_2: '',
  anesthesia_nurse_3: '',
};

const MULTI_SELECT_FIELDS = ['asa_intraop', 'muscle_relaxant', 'medical_gas', 'inhale', 'narcotic', 'local_agent'];

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

export default function IntraopForm({ patient }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hn, setHn] = useState(patient.hn || '');
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
        const formRes = await api.getIntraop(caseKey);
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
      const res = await api.saveIntraop(payload);
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
          <Field label="วันที่เริ่มผ่าตัด">
            <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
          </Field>
          <TextInput label="เวลาเริ่มผ่าตัด" value={form.start_time} onChange={(v) => set('start_time', v)} />
          <Field label="วันที่เสร็จผ่าตัด">
            <input type="date" value={form.finish_date} onChange={(e) => set('finish_date', e.target.value)} />
          </Field>
          <TextInput label="เวลาเสร็จผ่าตัด" value={form.finish_time} onChange={(v) => set('finish_time', v)} />
          <TextInput label="ระยะเวลาผ่าตัด (ชม.)" value={form.duration_hours} onChange={(v) => set('duration_hours', v)} />
          <TextInput label="ระยะเวลาผ่าตัด (นาที)" value={form.duration_minutes} onChange={(v) => set('duration_minutes', v)} />
          <TextInput label="HN" value={hn} onChange={setHn} />
          <TextInput label="ห้องผ่าตัด" value={form.or_room} onChange={(v) => set('or_room', v)} />
          <TextInput label="Post Dx." value={form.post_dx} onChange={(v) => set('post_dx', v)} />
          <TextInput label="Operation" value={form.operation} onChange={(v) => set('operation', v)} />
          <TextInput label="ช่วงเวลาบริการ" value={form.service_period} onChange={(v) => set('service_period', v)} />
        </div>
        <CheckboxGroup label="ASA intraop." options={ASA_OPTIONS} value={form.asa_intraop} onChange={(v) => set('asa_intraop', v)} />
      </section>

      <section className="af-section">
        <h3>Airway</h3>
        <div className="af-grid">
          <TextInput label="Position" value={form.position} onChange={(v) => set('position', v)} />
          <TextInput label="Anesth. technique" value={form.anesth_technique} onChange={(v) => set('anesth_technique', v)} />
          <TextInput label="Airway management" value={form.airway_management} onChange={(v) => set('airway_management', v)} />
          <TextInput label="Airway equipment" value={form.airway_equipment} onChange={(v) => set('airway_equipment', v)} />
          <TextInput label="Airway equipment (เคส GA ให้คีย์ทุกเคส)" value={form.airway_equipment_ga} onChange={(v) => set('airway_equipment_ga', v)} />
          <TextInput label="Type tube" value={form.type_tube} onChange={(v) => set('type_tube', v)} />
          <TextInput label="Tube No." value={form.tube_no} onChange={(v) => set('tube_no', v)} />
          <TextInput label="Tube Cuff" value={form.tube_cuff} onChange={(v) => set('tube_cuff', v)} />
          <TextInput label="Difficult to intubation" value={form.difficult_intubation} onChange={(v) => set('difficult_intubation', v)} />
          <TextInput label="Special technique" value={form.special_technique} onChange={(v) => set('special_technique', v)} />
          <TextInput label="Monitor" value={form.monitor} onChange={(v) => set('monitor', v)} />
        </div>
      </section>

      <section className="af-section">
        <h3>Technique & Agents</h3>
        <div className="af-grid">
          <TextInput label="Anesth. technique induction" value={form.anesth_technique_induction} onChange={(v) => set('anesth_technique_induction', v)} />
          <TextInput label="Induction agent" value={form.induction_agent} onChange={(v) => set('induction_agent', v)} />
          <TextInput label="Intubation agent" value={form.intubation_agent} onChange={(v) => set('intubation_agent', v)} />
          <TextInput label="Anesth. technique maintenance" value={form.anesth_technique_maintenance} onChange={(v) => set('anesth_technique_maintenance', v)} />
        </div>
        <CheckboxGroup label="Muscle relaxant" options={MUSCLE_RELAXANT_OPTIONS} value={form.muscle_relaxant} onChange={(v) => set('muscle_relaxant', v)} />
        <CheckboxGroup label="Medical Gas" options={MEDICAL_GAS_OPTIONS} value={form.medical_gas} onChange={(v) => set('medical_gas', v)} />
        <CheckboxGroup label="Inhale" options={INHALE_OPTIONS} value={form.inhale} onChange={(v) => set('inhale', v)} />
        <CheckboxGroup label="Narcotic" options={NARCOTIC_OPTIONS} value={form.narcotic} onChange={(v) => set('narcotic', v)} />
        <CheckboxGroup label="Local agent" options={LOCAL_AGENT_OPTIONS} value={form.local_agent} onChange={(v) => set('local_agent', v)} />
      </section>

      <section className="af-section">
        <h3>Blood Loss & Complications</h3>
        <TextInput label="Estimate Blood Loss (Ml)" value={form.estimate_blood_loss_ml} onChange={(v) => set('estimate_blood_loss_ml', v)} />
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
        <h3>หลังผ่าตัด / ทีมผู้ปฏิบัติงาน</h3>
        <RadioGroup label="On ventilator at ward" options={YES_NO_OPTIONS} value={form.on_ventilator_ward} onChange={(v) => set('on_ventilator_ward', v)} />
        <TextInput label="Transfer to" value={form.transfer_to} onChange={(v) => set('transfer_to', v)} />
        <div className="af-grid">
          <DoctorSelect label="วิสัญญีแพทย์คนที่ 1" value={form.anesthesiologist_1} onChange={(v) => set('anesthesiologist_1', v)} doctors={doctors} />
          <DoctorSelect label="วิสัญญีแพทย์คนที่ 2" value={form.anesthesiologist_2} onChange={(v) => set('anesthesiologist_2', v)} doctors={doctors} />
          <OfficerSelect label="วิสัญญีพยาบาล คนที่ 1" value={form.anesthesia_nurse_1} onChange={(v) => set('anesthesia_nurse_1', v)} officers={officers} />
          <OfficerSelect label="วิสัญญีพยาบาล คนที่ 2" value={form.anesthesia_nurse_2} onChange={(v) => set('anesthesia_nurse_2', v)} officers={officers} />
          <OfficerSelect label="วิสัญญีพยาบาล คนที่ 3" value={form.anesthesia_nurse_3} onChange={(v) => set('anesthesia_nurse_3', v)} officers={officers} />
        </div>
      </section>

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'กำลังบันทึก...' : recordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
      </button>
    </form>
  );
}
