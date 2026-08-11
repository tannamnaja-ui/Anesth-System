import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import AppHeader from '../components/AppHeader.jsx';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500, 1000];

// One column per field selected in the operation_set query
// (backend/routes/patients.js BASE_QUERY) — header text is the field/alias name.
const COLUMNS = [
  'operation_set_id',
  'room_name',
  'hn',
  'patient_name',
  'operation_name',
  'an',
  'vn',
  'doctor_name',
  'operation_set_type_name',
  'operation_time_type_name',
  'emergency_name',
  'operation_request_date',
  'operation_request_time',
  'operation_position',
  'emergency_id',
  'room_id',
  'operation_list_anes_type_id',
  'operation_set_cmpn_id',
  'anes_doctor_code',
  'screen_text',
  'operation_set_npo_time',
  'operation_set_npo_date',
  'bps',
  'bpd',
  'bw',
  'gcs_scale_eye_type_id',
  'operation_set_pc_type_id',
  'pulse',
  'gcs_scale_motor_type_id',
  'gcs_scale_verbal_type_id',
  'operation_set_depcode',
  'operation_set_resp_type_id',
  'rr',
  'temperature',
  'schedule_ok',
  'staff',
  'operation_type_name',
  'operation_list_anes_type_name',
  'set_department',
  'ward_name',
  'operation_list_anes_type_name_2',
  'note',
  'provision_diagnosis_text',
];

function todayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function IndexPage({ onLoggedOut }) {
  const [criteria, setCriteria] = useState({ an: '', hn: '', dateFrom: todayString(), dateTo: todayString() });
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [roomFilter, setRoomFilter] = useState('');
  const navigate = useNavigate();

  const roomOptions = useMemo(
    () =>
      [...new Set(patients.map((p) => p.room_name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [patients]
  );

  const filteredPatients = useMemo(
    () => (roomFilter ? patients.filter((p) => p.room_name === roomFilter) : patients),
    [patients, roomFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const pagedPatients = useMemo(
    () => filteredPatients.slice((page - 1) * pageSize, page * pageSize),
    [filteredPatients, page, pageSize]
  );

  async function runSearch(searchCriteria) {
    setError('');
    setLoading(true);
    try {
      const res = await api.searchPatients(searchCriteria);
      setPatients(res.data);
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch(criteria);
  }

  // Re-run automatically whenever the date range changes, so the list
  // always reflects the selected วันที่/ถึงวันที่ without needing a click.
  useEffect(() => {
    runSearch(criteria);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria.dateFrom, criteria.dateTo]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  async function handleLogout() {
    await api.logout();
    onLoggedOut();
    navigate('/login');
  }

  function openPatient(patient) {
    navigate('/patient', { state: { patient } });
  }

  return (
    <div className="app-shell">
      <AppHeader>
        <button type="button" className="btn btn-link" onClick={handleLogout}>
          ออกจากระบบ
        </button>
      </AppHeader>

      <form className="search-bar" onSubmit={handleSearch}>
        <label>
          AN
          <input
            type="text"
            value={criteria.an}
            onChange={(e) => setCriteria({ ...criteria, an: e.target.value })}
          />
        </label>
        <label>
          HN
          <input
            type="text"
            value={criteria.hn}
            onChange={(e) => setCriteria({ ...criteria, hn: e.target.value })}
          />
        </label>
        <label>
          วันที่
          <input
            type="date"
            value={criteria.dateFrom}
            onChange={(e) => setCriteria({ ...criteria, dateFrom: e.target.value })}
          />
        </label>
        <label>
          ถึงวันที่
          <input
            type="date"
            value={criteria.dateTo}
            onChange={(e) => setCriteria({ ...criteria, dateTo: e.target.value })}
          />
        </label>
        <label>
          ห้องผ่าตัด
          <select
            value={roomFilter}
            onChange={(e) => {
              setRoomFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">ทั้งหมด</option>
            {roomOptions.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="app-body app-body-single">
        <main className="content registry">
          <div className="registry-header">
            <h2>ทะเบียนผู้ป่วย</h2>
            <div className="pagination-controls">
              <label className="page-size-label">
                แสดง
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                รายการ/หน้า
              </label>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ก่อนหน้า
              </button>
              <span className="page-info">
                หน้า {page} / {totalPages} (ทั้งหมด {filteredPatients.length} รายการ)
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                หน้าถัดไป
              </button>
            </div>
          </div>

          <div className="record-table-wrap">
            <table className="record-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  {COLUMNS.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedPatients.map((p, index) => (
                  <tr key={`${p.an}-${p.hn}`} onClick={() => openPatient(p)}>
                    <td className="record-no">{(page - 1) * pageSize + index + 1}</td>
                    {COLUMNS.map((col) => (
                      <td key={col}>{p[col]}</td>
                    ))}
                  </tr>
                ))}
                {filteredPatients.length === 0 && (
                  <tr>
                    <td className="empty-hint" colSpan={COLUMNS.length + 1}>
                      ไม่มีข้อมูล — ลองค้นหาผู้ป่วย
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
