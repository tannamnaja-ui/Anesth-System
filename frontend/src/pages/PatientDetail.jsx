import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PreopAssessmentForm from './PreopAssessmentForm.jsx';
import NewAnesthForm from './NewAnesthForm.jsx';
import PostopVisitForm from './PostopVisitForm.jsx';
import IntubationOffsiteForm from './IntubationOffsiteForm.jsx';
import PostponeCancelForm from './PostponeCancelForm.jsx';
import AppHeader from '../components/AppHeader.jsx';

// New Anesth new form / Postop visit are hidden for now (not in use yet) —
// kept in TABS with hidden:true so re-enabling later is a one-line flip.
const TABS = [
  { key: 'preop-anesth', label: 'Preop Anesth' },
  { key: 'new-anesth', label: 'New Anesth new form', hidden: true },
  { key: 'postop-visit', label: 'Postop. visit รายเคส', hidden: true },
  { key: 'intubation-offsite', label: 'ใส่ท่อช่วยหายใจนอกสถานที่' },
  { key: 'postpone-cancel', label: 'เลื่อน/งดผ่าตัด' },
];
const VISIBLE_TABS = TABS.filter((tab) => !tab.hidden);

export default function PatientDetail() {
  const { state } = useLocation();
  const patient = state?.patient;
  const [activeTab, setActiveTab] = useState(VISIBLE_TABS[0].key);
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
          {VISIBLE_TABS.map((tab) => (
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
          {activeTab === 'preop-anesth' && <PreopAssessmentForm patient={patient} />}
          {activeTab === 'new-anesth' && <NewAnesthForm patient={patient} />}
          {activeTab === 'postop-visit' && <PostopVisitForm patient={patient} />}
          {activeTab === 'intubation-offsite' && <IntubationOffsiteForm patient={patient} />}
          {activeTab === 'postpone-cancel' && <PostponeCancelForm patient={patient} />}
        </div>
      </div>
    </div>
  );
}
