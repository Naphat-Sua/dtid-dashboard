import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { REVIEWER_ACCOUNTS, matchReviewerAccount } from './reviewerAccounts.js';

// Swap in a known credential so the test does not depend on the real password.
const known = { credentialHash: createHash('sha256').update('tester:secret-pass').digest('hex'), role: 'Analyst', fullName: 'Test Reviewer' };

test('matches the right credentials, case-insensitive username', async () => {
  REVIEWER_ACCOUNTS.push(known);
  try {
    assert.deepEqual(await matchReviewerAccount(' Tester ', 'secret-pass'), { username: 'tester', role: 'Analyst', fullName: 'Test Reviewer' });
    assert.equal(await matchReviewerAccount('tester', 'Secret-pass'), null);
    assert.equal(await matchReviewerAccount('tester', ''), null);
  } finally {
    REVIEWER_ACCOUNTS.pop();
  }
});

test('reviewer accounts are read-only roles', () => {
  for (const a of REVIEWER_ACCOUNTS) assert.notEqual(a.role, 'Admin');
});
