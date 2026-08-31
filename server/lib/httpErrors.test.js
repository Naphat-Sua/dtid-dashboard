import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapError } from './httpErrors.js';

test('unique_violation → 409', () => {
  assert.equal(mapError({ code: '23505' }).status, 409);
});

test('foreign_key_violation → 409', () => {
  assert.equal(mapError({ code: '23503' }).status, 409);
});

test('not_null / check / invalid-text → 400', () => {
  assert.equal(mapError({ code: '23502' }).status, 400);
  assert.equal(mapError({ code: '23514' }).status, 400);
  assert.equal(mapError({ code: '22P02' }).status, 400);
});

test('multer file-size limit → 413', () => {
  assert.equal(mapError({ code: 'LIMIT_FILE_SIZE' }).status, 413);
});

test('other multer LIMIT_* → 400', () => {
  assert.equal(mapError({ code: 'LIMIT_UNEXPECTED_FILE' }).status, 400);
});

test('csv fileFilter rejection → 415', () => {
  assert.equal(mapError({ message: 'Only .csv files are accepted' }).status, 415);
});

test('explicit err.status is honoured', () => {
  assert.equal(mapError({ status: 404, message: 'nope' }).status, 404);
  assert.equal(mapError({ status: 404, message: 'nope' }).message, 'nope');
});

test('unknown error → 500 and does not expose the message', () => {
  const r = mapError(new Error('secret internal detail'));
  assert.equal(r.status, 500);
  assert.equal(r.expose, false);
  assert.equal(r.message, 'Internal server error');
});

test('null/undefined → 500', () => {
  assert.equal(mapError(null).status, 500);
  assert.equal(mapError(undefined).status, 500);
});

test('known PG errors are marked safe to expose', () => {
  assert.equal(mapError({ code: '23505' }).expose, true);
});
