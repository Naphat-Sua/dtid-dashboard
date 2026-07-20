// ============================================================
// Defense-in-depth security middleware
// Helmet (headers) → CORS → rate limiting → HPP, per the documented
// 7-layer security model. JWT verification + RBAC live in auth.js and
// are applied per-route by the RBAC gate in index.js.
// ============================================================

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

export function securityMiddleware() {
  // Comma-separated allowlist; '*' (default) reflects the request origin.
  const origins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // General API limiter — sliding window, per IP.
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests — please slow down.' },
  });

  // Stricter limiter for authentication endpoints (brute-force protection).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts — try again later.' },
  });

  return {
    helmet: helmet(),
    cors: cors({
      origin: origins.includes('*') ? true : origins,
      credentials: true,
    }),
    limiter,
    authLimiter,
    hpp: hpp(),
  };
}
