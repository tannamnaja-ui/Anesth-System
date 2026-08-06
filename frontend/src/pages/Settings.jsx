import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const EMPTY_FORM = { host: '', port: '', database: '', username: '', password: '' };
const STORAGE_KEY = 'anesth-system:connection-settings';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Settings() {
  const saved = loadSaved();
  const [dbType, setDbType] = useState(saved?.dbType || 'mysql');
  const [form, setForm] = useState({ ...EMPTY_FORM, ...saved?.form });
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message }
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const isComplete = Object.values(form).every((v) => v.trim() !== '');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dbType, form }));
  }, [dbType, form]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleTest() {
    setStatus(null);
    setBusy(true);
    try {
      const res = await api.testConnection({ dbType, ...form });
      setStatus({ type: 'success', message: res.message });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setStatus(null);
    setBusy(true);
    try {
      await api.saveConnection({ dbType, ...form });
      navigate('/login');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card settings-card">
        <h1>ตั้งค่าการเชื่อมต่อ</h1>
        <p className="subtitle">เลือกชนิดฐานข้อมูลและกรอกข้อมูลการเชื่อมต่อ</p>

        {status && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {status.message}
          </div>
        )}

        <label>
          ชนิดฐานข้อมูล
          <select value={dbType} onChange={(e) => setDbType(e.target.value)}>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
          </select>
        </label>

        <label>
          IP Server
          <input
            type="text"
            placeholder="เช่น 10.0.0.10"
            value={form.host}
            onChange={(e) => updateField('host', e.target.value)}
            required
          />
        </label>

        <label>
          Port
          <input
            type="text"
            inputMode="numeric"
            placeholder="เช่น 5432"
            value={form.port}
            onChange={(e) => updateField('port', e.target.value)}
            required
          />
        </label>

        <label>
          Database
          <input
            type="text"
            value={form.database}
            onChange={(e) => updateField('database', e.target.value)}
            required
          />
        </label>

        <label>
          Username
          <input
            type="text"
            value={form.username}
            onChange={(e) => updateField('username', e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
          />
        </label>

        <div className="button-row">
          <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={busy || !isComplete}>
            ทดสอบการเชื่อมต่อ
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy || !isComplete}>
            บันทึกข้อมูลเชื่อมต่อ
          </button>
        </div>

        <button type="button" className="btn btn-link" onClick={() => navigate('/login')}>
          กลับหน้าเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}
