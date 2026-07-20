// ============================================================
// Authentication routes: login / refresh / logout / me
// ============================================================

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import {
  signAccessToken,
  signRefreshToken,
  verifyJwt,
  JWT_REFRESH_SECRET,
} from '../middleware/auth.js';

// A structurally valid bcrypt hash that no password matches — compared against
// when the username is unknown, so login timing doesn't leak account existence.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO0000000000000000000000000000000000';

export function createAuthRouter(pool, writeAudit, authLimiter) {
  const router = express.Router();

  // POST /api/auth/login
  router.post(
    '/login',
    authLimiter,
    body('username').isString().trim().notEmpty(),
    body('password').isString().notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { username, password } = req.body;
      const { rows } = await pool.query(
        'SELECT * FROM api_user WHERE username = $1 AND is_active = TRUE',
        [username]
      );
      const user = rows[0];

      // Always run a compare (dummy hash when user is missing) to equalise timing.
      const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
      if (!user || !ok) {
        return res.status(401).json({ message: 'Username หรือ Password ไม่ถูกต้อง' });
      }

      await pool.query('UPDATE api_user SET last_login = NOW() WHERE user_id = $1', [user.user_id]);
      req.user = { userId: user.user_id, username: user.username, role: user.role };
      await writeAudit(req, { action: 'LOGIN', entityType: 'api_user', entityId: user.user_id });

      res.json({
        accessToken: signAccessToken(user),
        refreshToken: signRefreshToken(user),
        user: {
          userId: user.user_id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        },
      });
    }
  );

  // POST /api/auth/refresh
  router.post(
    '/refresh',
    body('refreshToken').isString().notEmpty(),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid input' });
      try {
        const payload = jwt.verify(req.body.refreshToken, JWT_REFRESH_SECRET);
        if (payload.type !== 'refresh') throw new Error('wrong token type');
        const { rows } = await pool.query(
          'SELECT * FROM api_user WHERE user_id = $1 AND is_active = TRUE',
          [payload.sub]
        );
        const user = rows[0];
        if (!user) return res.status(401).json({ message: 'User no longer active' });
        res.json({
          accessToken: signAccessToken(user),
          refreshToken: signRefreshToken(user), // rotate on every refresh
          user: {
            userId: user.user_id,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
          },
        });
      } catch {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }
    }
  );

  // POST /api/auth/logout — stateless JWT; the client discards its tokens.
  router.post('/logout', verifyJwt, async (req, res) => {
    await writeAudit(req, { action: 'LOGOUT', entityType: 'api_user', entityId: req.user.userId });
    res.json({ message: 'Logged out' });
  });

  // GET /api/auth/me
  router.get('/me', verifyJwt, async (req, res) => {
    const { rows } = await pool.query(
      'SELECT user_id, username, full_name, role, last_login FROM api_user WHERE user_id = $1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    const u = rows[0];
    res.json({
      userId: u.user_id,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      lastLogin: u.last_login,
    });
  });

  return router;
}
