// ============================================================
// Audit-log helper
// Records mutating actions to the audit_log table (JSONB payload).
// Never throws into the request path — a failed audit write is logged
// and swallowed so it can't take down a legitimate operation.
// ============================================================

const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'password_hash', 'token', 'accessToken', 'refreshToken']);

/** Strip sensitive fields from a payload before it is persisted to the audit log. */
function sanitize(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[redacted]' : sanitize(v);
  }
  return out;
}

/** Extract the client IP, honouring a reverse proxy's X-Forwarded-For. */
function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}

/**
 * Build a writeAudit(req, entry) function bound to a pg pool.
 * entry = { action, entityType, entityId?, changes? }
 */
export function makeAudit(pool) {
  return async function writeAudit(req, { action, entityType = null, entityId = null, changes = null }) {
    try {
      const user = req.user || {};
      await pool.query(
        `INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, ip_address, changes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.userId ?? null,
          user.username ?? null,
          action,
          entityType,
          entityId != null ? String(entityId) : null,
          clientIp(req),
          changes ? JSON.stringify(sanitize(changes)) : null,
        ]
      );
    } catch (err) {
      console.error('audit_log write failed:', err.message);
    }
  };
}

export { sanitize };
