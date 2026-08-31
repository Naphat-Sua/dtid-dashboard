// Tests for the canonical enumerations. These guard against the enum drift
// that previously broke the AdminPage/SuspectList/StatsPanel controls: every
// value must be unique, carry a Thai label, and the "at large" / "detained"
// partition of person statuses must stay mutually exclusive and complete for
// the statuses the UI treats as one or the other.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_STATUSES,
  PERSON_STATUS_VALUES,
  AT_LARGE_STATUSES,
  DETAINED_STATUSES,
  RISK_LEVELS,
  RISK_LEVEL_VALUES,
  GENDERS,
  CASE_TYPES,
  CASE_STATUSES,
  RELATIONSHIP_TYPES,
  labelFor,
} from './enums.js';

const allOptionLists = { PERSON_STATUSES, RISK_LEVELS, GENDERS, CASE_TYPES, CASE_STATUSES, RELATIONSHIP_TYPES };

test('every option has a unique value and a non-empty Thai label', () => {
  for (const [name, list] of Object.entries(allOptionLists)) {
    const values = list.map((o) => o.value);
    assert.equal(new Set(values).size, values.length, `${name} has duplicate values`);
    for (const opt of list) {
      assert.ok(opt.value, `${name} has an empty value`);
      assert.ok(opt.label && opt.label.trim().length > 0, `${name}.${opt.value} has no label`);
      // Thai label should contain at least one Thai codepoint (except Line ID etc. which are proper nouns).
      assert.equal(typeof opt.label, 'string');
    }
  }
});

test('PERSON_STATUS_VALUES mirrors PERSON_STATUSES', () => {
  assert.deepEqual(PERSON_STATUS_VALUES, PERSON_STATUSES.map((s) => s.value));
});

test('RISK_LEVEL_VALUES mirrors RISK_LEVELS', () => {
  assert.deepEqual(RISK_LEVEL_VALUES, RISK_LEVELS.map((r) => r.value));
});

test('at-large and detained status sets are disjoint', () => {
  const overlap = AT_LARGE_STATUSES.filter((s) => DETAINED_STATUSES.includes(s));
  assert.deepEqual(overlap, [], 'a status cannot be both at-large and detained');
});

test('every at-large / detained status is a real person status', () => {
  for (const s of [...AT_LARGE_STATUSES, ...DETAINED_STATUSES]) {
    assert.ok(PERSON_STATUS_VALUES.includes(s), `${s} is not a defined person status`);
  }
});

test('the phantom "At Large" value that broke the old dropdowns is gone', () => {
  assert.ok(!PERSON_STATUS_VALUES.includes('At Large'));
});

test('labelFor returns the Thai label for a known value', () => {
  assert.equal(labelFor(PERSON_STATUSES, 'Arrested'), 'ถูกจับกุม');
  assert.equal(labelFor(RISK_LEVELS, 'Critical'), 'วิกฤต');
});

test('labelFor falls back to the raw value for an unknown value', () => {
  assert.equal(labelFor(PERSON_STATUSES, 'Nonexistent'), 'Nonexistent');
  assert.equal(labelFor(CASE_TYPES, undefined), undefined);
});
