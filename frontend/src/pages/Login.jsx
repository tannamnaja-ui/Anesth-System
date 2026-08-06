import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const DEPARTMENT_STORAGE_KEY = 'anesth-system:login-department';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalName, setHospitalName] = useState('');
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState(
    () => localStorage.getItem(DEPARTMENT_STORAGE_KEY) || ''
  );
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getHospitalName()
      .then((res) => setHospitalName(res.data || ''))
      .catch(() => {});
    api
      .getDepartments()
      .then((res) => setDepartments(res.data || []))
      .catch(() => {});
  }, []);

  function updateDepartment(value) {
    setDepartment(value);
    localStorage.setItem(DEPARTMENT_STORAGE_KEY, value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(username, password, department);
      onLoggedIn();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Anesth System{hospitalName ? ` - ${hospitalName}` : ''}</h1>
        <p className="subtitle">เข้าสู่ระบบ</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label>
          ห้องทำงาน
          <select value={department} onChange={(e) => updateDepartment(e.target.value)}>
            <option value="">-- เลือก --</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate('/settings')}
        >
          ตั้งค่าการเชื่อมต่อ
        </button>
      </form>
    </div>
  );
}
