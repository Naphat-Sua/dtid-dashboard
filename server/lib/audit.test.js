import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from './audit.js';

describe('audit sanitize', () => {
  it('redacts sensitive keys at any depth', () => {
    const out = sanitize({ name: 'x', password: 'secret', nested: { token: 'abc', ok: 1 } });
    assert.equal(out.name, 'x');
    assert.equal(out.password, '[redacted]');
    assert.equal(out.nested.token, '[redacted]');
    assert.equal(out.nested.ok, 1);
  });
  it('handles arrays and primitives', () => {
    assert.deepEqual(sanitize([{ password: 'p' }, { a: 1 }]), [{ password: '[redacted]' }, { a: 1 }]);
    assert.equal(sanitize('plain'), 'plain');
    assert.equal(sanitize(null), null);
  });
});
