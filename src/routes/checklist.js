const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /checklist - current checklist, any logged-in user
router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, checklist, created_at FROM checklist_versions WHERE is_current = true LIMIT 1'
  );
  if (!rows.length) return res.status(404).json({ error: 'No checklist configured yet' });
  res.json({ checklistVersionId: rows[0].id, checklist: rows[0].checklist, createdAt: rows[0].created_at });
});

// PUT /checklist - admin only: saves a new version and makes it current
// (old versions are kept, not overwritten, so existing assessments still
// reference the checklist shape they were actually answered against)
router.put('/', requireRole('admin'), async (req, res) => {
  const { checklist } = req.body || {};
  if (!checklist || !Array.isArray(checklist.sections)) {
    return res.status(400).json({ error: 'checklist.sections array is required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE checklist_versions SET is_current = false WHERE is_current = true');
    const { rows } = await client.query(
      'INSERT INTO checklist_versions (checklist, is_current, created_by) VALUES ($1, true, $2) RETURNING id, created_at',
      [JSON.stringify(checklist), req.user.id]
    );
    await client.query('COMMIT');
    res.json({ checklistVersionId: rows[0].id, checklist, createdAt: rows[0].created_at });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;
