// Integration test for the validate() middleware against a throwaway Express
// app on an ephemeral port (does NOT import index.js, so no DB/port binding).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { body, param } from 'express-validator';
import { validate } from './validate.js';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/persons/:id',
    validate([param('id').isInt(), body('FirstName').trim().notEmpty()]),
    (req, res) => res.json({ ok: true, id: req.params.id }),
  );
  return app;
}

async function once(app, path, bodyObj) {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(bodyObj),
    });
    const json = await res.json();
    return { status: res.status, json };
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test('passes a valid request through to the handler', async () => {
  const r = await once(makeApp(), '/persons/5', { FirstName: 'สมชาย' });
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
});

test('rejects a non-integer :id with 400 + field error', async () => {
  const r = await once(makeApp(), '/persons/abc', { FirstName: 'สมชาย' });
  assert.equal(r.status, 400);
  assert.ok(Array.isArray(r.json.errors));
  assert.ok(r.json.errors.some((e) => e.field === 'id'));
});

test('rejects a missing required body field with 400', async () => {
  const r = await once(makeApp(), '/persons/5', {});
  assert.equal(r.status, 400);
  assert.ok(r.json.errors.some((e) => e.field === 'FirstName'));
});

test('reports every failing field at once', async () => {
  const r = await once(makeApp(), '/persons/abc', { FirstName: '   ' });
  assert.equal(r.status, 400);
  const fields = r.json.errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ['FirstName', 'id']);
});
