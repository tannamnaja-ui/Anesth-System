import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Settings from './pages/Settings.jsx';
import IndexPage from './pages/IndexPage.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import { api } from './api/client.js';

function ProtectedRoute({ authState, children }) {
  if (authState === 'loading') return null;
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [authState, setAuthState] = useState('loading');

  useEffect(() => {
    api
      .me()
      .then((res) => setAuthState(res.authenticated ? 'authenticated' : 'unauthenticated'))
      .catch(() => setAuthState('unauthenticated'));
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login onLoggedIn={() => setAuthState('authenticated')} />} />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/"
        element={
          <ProtectedRoute authState={authState}>
            <IndexPage onLoggedOut={() => setAuthState('unauthenticated')} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <ProtectedRoute authState={authState}>
            <PatientDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
