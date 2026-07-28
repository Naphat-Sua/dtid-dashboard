import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUpdate } from './updateBuilder.js';

const COLS = { FirstName: 'first_name', Status: 'status', RiskLevel: 'risk_level' };

test('builds a parameterized SET clause for allow-listed keys only', () => {
  const r = buildUpdate({ FirstName: 'A', Status: 'Active' }, COLS);
  assert.deepEqual(r.setClauses, ['first_name = $1', 'status = $2']);
  assert.deepEqual(r.values, ['A', 'Active']);
  assert.equal(r.nextIdx, 3);
});

test('ignores keys not in the allow-list (mass-assignment guard)', () => {
  const r = buildUpdate({ FirstName: 'A', person_id: 99, created_at: 'x', DROP: 1 }, COLS);
  assert.deepEqual(r.setClauses, ['first_name = $1']);
  assert.deepEqual(r.values, ['A']);
});

test('a malicious identifier-injection key never reaches the SQL', () => {
  const r = buildUpdate({ 'status = 1; DROP TABLE person; --': 'x', Status: 'Active' }, COLS);
  // Only the allow-listed Status column appears; the attacker key is dropped.
  assert.deepEqual(r.setClauses, ['status = $1']);
  assert.equal(r.values.length, 1);
});

test('honours a custom starting placeholder index', () => {
  const r = buildUpdate({ Status: 'Active' }, COLS, 5);
  assert.deepEqual(r.setClauses, ['status = $5']);
  assert.equal(r.nextIdx, 6);
});

test('returns null when no allow-listed columns are present', () => {
  assert.equal(buildUpdate({ nope: 1 }, COLS), null);
  assert.equal(buildUpdate({}, COLS), null);
  assert.equal(buildUpdate(null, COLS), null);
  assert.equal(buildUpdate(undefined, COLS), null);
});

test('a falsy-but-valid value (empty string, 0, false) is still included', () => {
  const r = buildUpdate({ FirstName: '', Status: 0, RiskLevel: false }, COLS);
  assert.equal(r.setClauses.length, 3);
  assert.deepEqual(r.values, ['', 0, false]);
});
