import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import NewAnesthForm from './NewAnesthForm.jsx';
import PostopVisitForm from './PostopVisitForm.jsx';
import IntubationOffsiteForm from './IntubationOffsiteForm.jsx';
import PostponeCancelForm from './PostponeCancelForm.jsx';
import AppHeader from '../components/AppHeader.jsx';

const TABS = [
  { key: 'new-anesth', label: 'New Anesth new form' },
  { key: 'postop-visit', label: 'Postop. visit รายเคส' },
  { key: 'intubation-offsite', label: 'ใส่ท่อช่วยหายใจนอกสถานที่' },
  { key: 'postpone-cancel', label: 'เลื่อน/งดผ่าตัด' },
];

export default function PatientDetail() {
  const { state } = useLocation();
  const patient = state?.patient;
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const navigate = useNavigate();

  if (!patient) {
    return (
      <div className="app-shell">
        <AppHeader />
        <div className="content">
          <p className="empty-hint">ไม่พบข้อมูลผู้ป่วย กรุณากลับไปเลือกผู้ป่วยจากหน้าทะเบียนผู้ป่วยอีกครั้ง</p>
          <button type="button" className="btn btn-link" onClick={() => navigate('/')}>
            กลับหน้าทะเบียนผู้ป่วย
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader>
        <button type="button" className="btn btn-link" onClick={() => navigate('/')}>
          กลับหน้าทะเบียนผู้ป่วย
        </button>
      </AppHeader>

      <div className="content patient-detail-content">
        <div className="patient-header">
          <strong>{patient.patient_name}</strong>
          <span>
            AN: {patient.an} · HN: {patient.hn}
          </span>
          <span>
            {patient.room_name} · {patient.operation_name}
          </span>
        </div>

        <nav className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {activeTab === 'new-anesth' && <NewAnesthForm patient={patient} />}
          {activeTab === 'postop-visit' && <PostopVisitForm patient={patient} />}
          {activeTab === 'intubation-offsite' && <IntubationOffsiteForm patient={patient} />}
          {activeTab === 'postpone-cancel' && <PostponeCancelForm patient={patient} />}
        </div>
      </div>
    </div>
  );
}
