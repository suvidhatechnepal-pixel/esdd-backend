const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('./pool');
const defaultChecklist = require('../seed/defaultChecklist');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function seed() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query('SELECT id FROM checklist_versions WHERE is_current = true LIMIT 1');
    if (existing.length === 0) {
      await client.query(
        `INSERT INTO checklist_versions (checklist, is_current) VALUES ($1, true)`,
        [JSON.stringify(defaultChecklist)]
      );
      console.log('Seeded default checklist (13 questions, Annex 5).');
    } else {
      console.log('Checklist already seeded - skipping.');
    }

    const { rows: userCount } = await client.query('SELECT count(*)::int FROM users');
    if (userCount[0].count === 0) {
      console.log('\nNo users exist yet - creating the first Admin account.');
      const name = await ask('Admin full name: ');
      const email = await ask('Admin email: ');
      const password = await ask('Temporary password (share with the admin, they will be forced to change it on first login): ');
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        `INSERT INTO users (email, name, password_hash, role, must_reset_password) VALUES ($1, $2, $3, 'admin', true)`,
        [email.trim().toLowerCase(), name.trim(), hash]
      );
      console.log(`\nAdmin account created for ${email}. They can now log in and create the rest of your team.`);
    } else {
      console.log('Users already exist - skipping admin creation.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
