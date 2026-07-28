import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { signAccessToken, verifyJwt, requireRole, ROLE_LEVEL, JWT_ACCESS_SECRET } from './auth.js';

const fakeRes = () => ({
  statusCode: 200, body: null,
  status(c) { this.statusCode = c; return this; },
  json(b) { this.body = b; return this; },
});
const run = (mw, req) => new Promise((resolve) => {
  const res = fakeRes();
  mw(req, res, () => resolve({ res, nexted: true }));
  setTimeout(() => resolve({ res, nexted: false }), 15);
});

describe('auth middleware', () => {
  const user = { user_id: 1, username: 'admin', role: 'Admin' };

  it('signs an access token carrying the role', () => {
    const p = jwt.verify(signAccessToken(user), JWT_ACCESS_SECRET);
    assert.equal(p.role, 'Admin');
    assert.equal(p.type, 'access');
  });

  it('verifyJwt accepts a valid Bearer token', async () => {
    const r = await run(verifyJwt, { headers: { authorization: `Bearer ${signAccessToken(user)}` } });
    assert.equal(r.nexted, true);
    assert.equal(r.res.statusCode, 200);
  });

  it('verifyJwt rejects missing / invalid token with 401', async () => {
    assert.equal((await run(verifyJwt, { headers: {} })).res.statusCode, 401);
    assert.equal((await run(verifyJwt, { headers: { authorization: 'Bearer nope' } })).res.statusCode, 401);
  });

  it('role hierarchy is Viewer < Analyst < Admin', () => {
    assert.ok(ROLE_LEVEL.Viewer < ROLE_LEVEL.Analyst);
    assert.ok(ROLE_LEVEL.Analyst < ROLE_LEVEL.Admin);
  });

  it('requireRole blocks a lower role (403) and allows a sufficient one', async () => {
    assert.equal((await run(requireRole('Admin'), { user: { role: 'Viewer' } })).res.statusCode, 403);
    assert.equal((await run(requireRole('Admin'), { user: { role: 'Admin' } })).nexted, true);
    assert.equal((await run(requireRole('Analyst'), { user: { role: 'Viewer' } })).res.statusCode, 403);
  });
});
