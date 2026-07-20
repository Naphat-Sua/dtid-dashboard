// ============================================================
// JWT authentication + Role-Based Access Control (RBAC)
// Two-tier tokens (Access 8h + Refresh 7d) per the documented model.
// ============================================================

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const JWT_ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'dtid-dev-access-secret-change-me';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dtid-dev-refresh-secret-change-me';
export const ACCESS_TTL  = process.env.JWT_ACCESS_TTL  || '8h';   // Access Token — 8 hours
export const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';   // Refresh Token — 7 days

// Role hierarchy — a higher level implicitly satisfies lower-level requirements.
export const ROLE_LEVEL = { Viewer: 1, Analyst: 2, Admin: 3 };

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.user_id, username: user.username, role: user.role, type: 'access' },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.user_id, username: user.username, role: user.role, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

/** Verify a Bearer access token and attach req.user, else 401. */
export function verifyJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    if (payload.type !== 'access') throw new Error('wrong token type');
    req.user = { userId: payload.sub, username: payload.username, role: payload.role };
    next();
  } catch {
    // A distinct code lets the client trigger its refresh flow.
    return res.status(401).json({ message: 'Invalid or expired token', code: 'TOKEN_EXPIRED' });
  }
}

/** Require the authenticated user to hold at least `minRole`. */
export function requireRole(minRole) {
  const min = ROLE_LEVEL[minRole] || 99;
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if ((ROLE_LEVEL[req.user.role] || 0) < min) {
      return res.status(403).json({ message: `Requires ${minRole} role or higher` });
    }
    next();
  };
}

/** Optional API-key auth for service-to-service calls (timing-safe compare). */
export function apiKeyAuth(req, res, next) {
  const expected = process.env.SERVICE_API_KEY || '';
  if (!expected) return res.status(503).json({ message: 'Service API key not configured' });
  const provided = String(req.headers['x-api-key'] || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    req.user = { userId: null, username: 'service', role: 'Admin' };
    return next();
  }
  return res.status(401).json({ message: 'Invalid API key' });
}
