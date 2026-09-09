const express = require('express');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { computeRating } = require('../rating');

const router = express.Router();
router.use(requireAuth);

async function currentChecklist() {
  const { rows } = await pool.query('SELECT id, checklist FROM checklist_versions WHERE is_current = true LIMIT 1');
  if (!rows.length) throw Object.assign(new Error('No checklist configured'), { status: 500 });
  return rows[0];
}

function withComputedRating(row, checklist) {
  const rating = computeRating(checklist, row.answers || {});
  return { ...row, rating };
}

// GET /assessments - assessors see only their own; admin/reviewer see everyone's
router.get('/', async (req, res) => {
  const { checklist } = await currentChecklist();
  const isPrivileged = req.user.role === 'admin' || req.user.role === 'reviewer';
  const { rows } = await pool.query(
    isPrivileged
      ? 'SELECT * FROM assessments ORDER BY updated_at DESC'
      : 'SELECT * FROM assessments WHERE created_by = $1 ORDER BY updated_at DESC',
    isPrivileged ? [] : [req.user.id]
  );
  res.json({ assessments: rows.map((r) => withComputedRating(r, checklist)) });
});

// GET /assessments/:id
router.get('/:id', async (req, res) => {
  const { checklist } = await currentChecklist();
  const { rows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Not found' });
  const isOwner = row.created_by === req.user.id;
  const isPrivileged = req.user.role === 'admin' || req.user.role === 'reviewer';
  if (!isOwner && !isPrivileged) return res.status(403).json({ error: 'Not your assessment' });
  res.json({ assessment: withComputedRating(row, checklist) });
});

// POST /assessments - create a new draft, owned by the logged-in user
router.post('/', async (req, res) => {
  const { id: checklistVersionId } = await currentChecklist();
  const b = req.body || {};
  const { rows } = await pool.query(
    `INSERT INTO assessments
      (checklist_version_id, created_by, client, transaction_id, location, sector, product, officer, business_line, loan_category, assessment_date, answers, summary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [checklistVersionId, req.user.id, b.client || '', b.transactionId || '', b.location || '', b.sector || '',
     b.product || '', b.officer || '', b.businessLine || '', b.loanCategory || '', b.date || null,
     JSON.stringify(b.answers || {}), JSON.stringify(b.summary || {})]
  );
  const { checklist } = await currentChecklist();
  res.status(201).json({ assessment: withComputedRating(rows[0], checklist) });
});

// PATCH /assessments/:id - owner can edit their own draft; admin can edit any
router.patch('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const isOwner = existing.created_by === req.user.id;
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your assessment' });
  if (existing.status !== 'draft' && req.user.role !== 'admin') {
    return res.status(409).json({ error: 'This assessment has been submitted and can no longer be edited' });
  }

  const b = req.body || {};
  const { rows } = await pool.query(
    `UPDATE assessments SET
      client=$1, transaction_id=$2, location=$3, sector=$4, product=$5, officer=$6,
      business_line=$7, loan_category=$8, assessment_date=$9, answers=$10, summary=$11, updated_at=now()
     WHERE id=$12 RETURNING *`,
    [b.client, b.transactionId, b.location, b.sector, b.product, b.officer, b.businessLine, b.loanCategory,
     b.date, JSON.stringify(b.answers || {}), JSON.stringify(b.summary || {}), req.params.id]
  );
  const { checklist } = await currentChecklist();
  res.json({ assessment: withComputedRating(rows[0], checklist) });
});

// POST /assessments/:id/submit - assessor locks the draft and escalates for review
// (mirrors Step 6 "Escalation" of the Guideline: Medium/High must go to a reviewer)
router.post('/:id/submit', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.created_by !== req.user.id) return res.status(403).json({ error: 'Not your assessment' });

  const { checklist } = await currentChecklist();
  const rating = computeRating(checklist, existing.answers);
  if (!rating.complete) return res.status(400).json({ error: 'Answer every rated question before submitting' });

  const { rows } = await pool.query(
    `UPDATE assessments SET status='submitted', updated_at=now() WHERE id=$1 RETURNING *`,
    [req.params.id]
  );
  res.json({ assessment: withComputedRating(rows[0], checklist) });
});

// POST /assessments/:id/review - admin/reviewer only: approve or reject a submitted assessment
router.post('/:id/review', requireRole('admin', 'reviewer'), async (req, res) => {
  const { decision, notes } = req.body || {};
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
  }
  const { rows } = await pool.query(
    `UPDATE assessments SET status=$1, reviewed_by=$2, reviewed_at=now(), review_notes=$3, updated_at=now()
     WHERE id=$4 AND status='submitted' RETURNING *`,
    [decision, req.user.id, notes || '', req.params.id]
  );
  if (!rows.length) return res.status(409).json({ error: 'Assessment is not awaiting review' });
  const { checklist } = await currentChecklist();
  res.json({ assessment: withComputedRating(rows[0], checklist) });
});

// DELETE /assessments/:id - owner (draft only) or admin
router.delete('/:id', async (req, res) => {
  const { rows: existingRows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const isOwner = existing.created_by === req.user.id;
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your assessment' });
  if (existing.status !== 'draft' && req.user.role !== 'admin') {
    return res.status(409).json({ error: 'Only draft assessments can be deleted' });
  }
  await pool.query('DELETE FROM assessments WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

// POST /assessments/:id/draft-summary - server-side AI draft (uses ANTHROPIC_API_KEY, never exposed to the browser)
router.post('/:id/draft-summary', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'AI drafting is not configured on this server yet (missing ANTHROPIC_API_KEY)' });
  }
  const { rows } = await pool.query('SELECT * FROM assessments WHERE id = $1', [req.params.id]);
  const a = rows[0];
  if (!a) return res.status(404).json({ error: 'Not found' });
  const isOwner = a.created_by === req.user.id;
  if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Not your assessment' });

  const { checklist } = await currentChecklist();
  const rating = computeRating(checklist, a.answers);

  const lines = [];
  checklist.sections.forEach((sec) => sec.questions.forEach((q) => {
    const ans = a.answers[q.id];
    if (!ans || !ans.option) return;
    lines.push(`Q${q.id} [${sec.name}]: ${q.text}`);
    lines.push(`Answer: (${ans.option}) ${q.options[ans.option] || ''}${q.exclude ? ' [informational, not rated]' : ''}`);
    if (ans.comment && ans.comment.trim()) lines.push(`Officer's comment/evidence: ${ans.comment.trim()}`);
    lines.push('');
  }));
  if (!lines.length) return res.status(400).json({ error: 'Answer at least one question before drafting a summary' });

  const context = [
    `Client: ${a.client || '(unnamed)'}`,
    `Sector: ${a.sector || 'n/a'}   Product manufactured/traded: ${a.product || 'n/a'}`,
    `Business line (sub-sector): ${a.business_line || 'n/a'}   Loan category: ${a.loan_category || 'n/a'}   Location: ${a.location || 'n/a'}`,
    `Computed ESRR: ${rating.complete ? rating.tier.toUpperCase() : `Incomplete (${rating.answeredCount}/${rating.total} answered)`}`,
    '', 'Checklist responses:', ...lines,
  ].join('\n');

  const system = "You are drafting the E&S Risk Summary (Annex 7 of the bank's ESRM Guideline) that accompanies an ESDD checklist in a credit proposal. Base every statement strictly on the client info, checklist responses and comments given to you - never invent facts, dates, or figures that were not provided. Where an officer left no comment on a question, do not speculate about specifics; describe the finding only at the level of detail the answer option itself supports. Respond with ONLY a raw JSON object (no markdown fences, no preamble) with exactly these seven string keys: \"natureOfLoan\", \"infoReviewed\", \"keyIssues\", \"environmentalCompliance\", \"socialCompliance\", \"covenantsMonitoring\", \"furtherActions\". Follow Annex 7's structure exactly for what each field should contain.";

  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1400,
      system,
      messages: [{ role: 'user', content: context }],
    }),
  });
  if (!apiRes.ok) return res.status(502).json({ error: 'AI drafting request failed' });
  const data = await apiRes.json();
  const text = (data.content || []).map((b) => b.text || '').join('\n').replace(/```json|```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(text); } catch { return res.status(502).json({ error: 'AI returned an unexpected format' }); }

  res.json({ summary: parsed });
});

module.exports = router;
