import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function AppHeader({ children }) {
  const [hospitalName, setHospitalName] = useState('');
  const [officer, setOfficer] = useState(null);

  useEffect(() => {
    api
      .getHospitalName()
      .then((res) => setHospitalName(res.data || ''))
      .catch(() => {});
    api
      .me()
      .then((res) => setOfficer(res.authenticated ? res.officer : null))
      .catch(() => {});
  }, []);

  return (
    <header className="app-header">
      <h1>Anesth System{hospitalName ? ` - ${hospitalName}` : ''}</h1>
      <div className="app-header-right">
        {officer && (
          <span className="officer-info">
            {officer.name}
            {officer.department ? ` (${officer.department})` : ''}
          </span>
        )}
        {children}
      </div>
    </header>
  );
}
