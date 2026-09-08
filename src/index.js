require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const checklistRoutes = require('./routes/checklist');
const assessmentRoutes = require('./routes/assessments');

const app = express();

app.use(cors({
  origin: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true, service: 'esdd-risk-console-api' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/checklist', checklistRoutes);
app.use('/assessments', assessmentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Something went wrong on our end' });
});

const port = process.env.PORT || 3000;
app.listen(port, '127.0.0.1', () => {
  console.log(`esdd-risk-console-api listening on 127.0.0.1:${port}`);
});
