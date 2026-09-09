const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /users - admin only: list everyone
router.get('/', requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, email, name, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users: rows });
});

// POST /users - admin only: invite a new user with a temporary password
router.post('/', requireRole('admin'), async (req, res) => {
  const { email, name, role } = req.body || {};
  if (!email || !name || !['admin', 'assessor', 'reviewer'].includes(role)) {
    return res.status(400).json({ error: 'email, name and a valid role (admin/assessor/reviewer) are required' });
  }
  const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const hash = await bcrypt.hash(tempPassword, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, must_reset_password)
       VALUES ($1, $2, $3, $4, true) RETURNING id, email, name, role, created_at`,
      [email.trim().toLowerCase(), name.trim(), hash, role]
    );
    // NOTE: wire this to real email delivery before going live with real staff -
    // for now the temp password is returned once in the response for the admin
    // to relay manually.
    res.status(201).json({ user: rows[0], tempPassword });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A user with that email already exists' });
    throw err;
  }
});

// PATCH /users/:id - admin only: change role or active status
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const { role, isActive } = req.body || {};
  const fields = [];
  const values = [];
  let i = 1;
  if (role) { fields.push(`role = $${i++}`); values.push(role); }
  if (typeof isActive === 'boolean') { fields.push(`is_active = $${i++}`); values.push(isActive); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING id, email, name, role, is_active`,
    values
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json({ user: rows[0] });
});

module.exports = router;
