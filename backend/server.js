const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const patientRoutes = require('./routes/patients');
const officerRoutes = require('./routes/officers');
const doctorRoutes = require('./routes/doctors');
const anesFormRoutes = require('./routes/anesForm');
const postopVisitRoutes = require('./routes/postopVisit');
const intubationOffsiteRoutes = require('./routes/intubationOffsite');
const postponeCancelRoutes = require('./routes/postponeCancel');
const hospitalRoutes = require('./routes/hospital');
const departmentRoutes = require('./routes/departments');
const preopAssessmentRoutes = require('./routes/preopAssessment');
const { getSessionSecret } = require('./utils/connectionStore');

const app = express();
const PORT = process.env.PORT || 8020;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}`;

// When packaged with pkg, __dirname is inside the read-only snapshot, so the
// built frontend is shipped as a real folder next to the exe instead.
const FRONTEND_DIST = process.pkg
  ? path.join(path.dirname(process.execPath), 'frontend-dist')
  : path.join(__dirname, '..', 'frontend', 'dist');

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/anes-form', anesFormRoutes);
app.use('/api/postop-visit', postopVisitRoutes);
app.use('/api/intubation-offsite', intubationOffsiteRoutes);
app.use('/api/postpone-cancel', postponeCancelRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/preop-assessment', preopAssessmentRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built frontend (frontend/dist) on the same port, so the whole
// app is reachable from a single URL. Falls back to index.html for any
// non-API route so React Router can handle client-side navigation.
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Anesth System server listening on http://localhost:${PORT}`);
});
