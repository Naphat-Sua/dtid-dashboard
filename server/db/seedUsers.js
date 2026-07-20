// ============================================================
// Seed demo api_user accounts with bcrypt-hashed passwords.
// Run: node db/seedUsers.js   (or: npm run db:seed:users)
//
// Demo credentials are for LOCAL / DEMONSTRATION use only and are
// documented in server/.env.example. Change them before any real use.
// ============================================================

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'dtid_dashboard',
});

const ROUNDS = 12; // bcrypt cost factor (per documented security model)

const DEMO_USERS = [
  { username: 'admin',   password: 'admin1234',   full_name: 'ผู้ดูแลระบบ (Demo)',   role: 'Admin'   },
  { username: 'analyst', password: 'analyst1234', full_name: 'นักวิเคราะห์ (Demo)',   role: 'Analyst' },
  { username: 'viewer',  password: 'viewer1234',  full_name: 'ผู้บังคับบัญชา (Demo)', role: 'Viewer'  },
];

async function main() {
  try {
    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash(u.password, ROUNDS);
      await pool.query(
        `INSERT INTO api_user (username, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (username) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               full_name     = EXCLUDED.full_name,
               role          = EXCLUDED.role,
               is_active     = TRUE`,
        [u.username, hash, u.full_name, u.role]
      );
      console.log(`✓ seeded user '${u.username}' (${u.role})`);
    }
    console.log('Demo users seeded.');
  } catch (err) {
    console.error('Failed to seed users:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
