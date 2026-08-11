async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  // A 401 on anything other than the login attempt itself means the
  // session expired (e.g. the server restarted, which wipes the in-memory
  // session store) — bounce back to login instead of leaving every tab
  // stuck on an opaque error.
  if (res.status === 401 && path !== '/auth/login') {
    window.location.href = '/login';
    throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'เกิดข้อผิดพลาด');
  }
  return data;
}

export const api = {
  login: (username, password, department) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, department }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  testConnection: (connection) =>
    request('/settings/test-connection', { method: 'POST', body: JSON.stringify(connection) }),
  saveConnection: (connection) =>
    request('/settings/save-connection', { method: 'POST', body: JSON.stringify(connection) }),
  connectionStatus: () => request('/settings/status'),
  searchPatients: (params) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return request(`/patients/search?${query.toString()}`);
  },
  getOfficers: () => request('/officers'),
  getDoctors: () => request('/doctors'),
  getAnesForm: (an) => request(`/anes-form/new-anesth/${encodeURIComponent(an)}`),
  saveAnesForm: (payload) =>
    request('/anes-form/new-anesth', { method: 'POST', body: JSON.stringify(payload) }),
  getPostopVisit: (an) => request(`/postop-visit/visit/${encodeURIComponent(an)}`),
  savePostopVisit: (payload) =>
    request('/postop-visit/visit', { method: 'POST', body: JSON.stringify(payload) }),
  getIntubationOffsite: (an) => request(`/intubation-offsite/record/${encodeURIComponent(an)}`),
  saveIntubationOffsite: (payload) =>
    request('/intubation-offsite/record', { method: 'POST', body: JSON.stringify(payload) }),
  getPostponeCancel: (an) => request(`/postpone-cancel/record/${encodeURIComponent(an)}`),
  savePostponeCancel: (payload) =>
    request('/postpone-cancel/record', { method: 'POST', body: JSON.stringify(payload) }),
  getHospitalName: () => request('/hospital/name'),
  getDepartments: () => request('/departments'),
  getPreopAssessment: (an) => request(`/preop-assessment/record/${encodeURIComponent(an)}`),
  savePreopAssessment: (payload) =>
    request('/preop-assessment/record', { method: 'POST', body: JSON.stringify(payload) }),
  getDifficultIntubationOr: (an) => request(`/difficult-intubation-or/record/${encodeURIComponent(an)}`),
  saveDifficultIntubationOr: (payload) =>
    request('/difficult-intubation-or/record', { method: 'POST', body: JSON.stringify(payload) }),
};
