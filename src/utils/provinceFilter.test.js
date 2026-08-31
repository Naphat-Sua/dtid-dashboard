import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocationProvince,
  locationMatchesProvince,
  filterCasesByProvince,
  getPersonIdsForCases,
} from './provinceFilter.js';

const locations = [
  { LocationID: 1, Province: 'เชียงราย' },
  { LocationID: 2, Province: 'กรุงเทพมหานคร' },
  { LocationID: 3, province: 'เชียงราย' }, // lowercase (API shape)
];
const cases = [
  { CaseID: 10, LocationID: 1 }, { CaseID: 11, LocationID: 2 },
  { CaseID: 12, LocationID: 3 }, { CaseID: 13, LocationID: 999 },
];
const personCases = [
  { CaseID: 10, PersonID: 100 }, { CaseID: 11, PersonID: 200 }, { CaseID: 12, PersonID: 100 },
];
const CR = { en: 'Chiang Rai', th: 'เชียงราย' };

describe('provinceFilter', () => {
  it('getLocationProvince handles PascalCase and camelCase', () => {
    assert.equal(getLocationProvince(locations[0]), 'เชียงราย');
    assert.equal(getLocationProvince(locations[2]), 'เชียงราย');
    assert.equal(getLocationProvince(undefined), null);
  });
  it('null filter passes everything', () => {
    assert.equal(locationMatchesProvince(locations[1], null), true);
  });
  it('matches on the Thai province name', () => {
    assert.equal(locationMatchesProvince(locations[0], CR), true);
    assert.equal(locationMatchesProvince(locations[1], CR), false);
  });
  it('returns all cases when no province', () => {
    assert.equal(filterCasesByProvince(cases, locations, null).length, 4);
  });
  it('scopes cases to province and drops dangling locations', () => {
    const cr = filterCasesByProvince(cases, locations, CR);
    assert.deepEqual(cr.map((c) => c.CaseID).sort((a, b) => a - b), [10, 12]);
  });
  it('maps case ids to person ids', () => {
    assert.deepEqual([...getPersonIdsForCases(personCases, new Set([10, 12]))], [100]);
  });
});
