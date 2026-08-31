import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKey, normalizeRow, normalizeRows, normalizeAllData } from './normalizeApi.js';

test('single-word keys just capitalize', () => {
  for (const [inp, out] of [
    ['status', 'Status'], ['alias', 'Alias'], ['notes', 'Notes'],
    ['province', 'Province'], ['quantity', 'Quantity'], ['verdict', 'Verdict'],
    ['role', 'Role'], ['unit', 'Unit'], ['strength', 'Strength'], ['evidence', 'Evidence'],
    ['district', 'District'], ['latitude', 'Latitude'], ['longitude', 'Longitude'],
  ]) {
    assert.equal(normalizeKey(inp), out);
  }
});

test('trailing Id / Url acronyms are fixed to ID / URL', () => {
  for (const [inp, out] of [
    ['personId', 'PersonID'], ['caseId', 'CaseID'], ['locationId', 'LocationID'],
    ['nationalId', 'NationalID'], ['photoUrl', 'PhotoURL'],
    ['currentAddressId', 'CurrentAddressID'], ['seizureId', 'SeizureID'],
    ['relationshipId', 'RelationshipID'], ['casePersonId', 'CasePersonID'],
    ['personLocationId', 'PersonLocationID'], ['person1Id', 'Person1ID'],
    ['person2Id', 'Person2ID'],
  ]) {
    assert.equal(normalizeKey(inp), out);
  }
});

test('mid-word "id"/"url" are NOT corrupted (evidence, district stay intact)', () => {
  assert.equal(normalizeKey('evidence'), 'Evidence');
  assert.equal(normalizeKey('district'), 'District');
  assert.equal(normalizeKey('subDistrict'), 'SubDistrict');
});

test('multi-word camelCase keys PascalCase correctly', () => {
  for (const [inp, out] of [
    ['firstName', 'FirstName'], ['lastName', 'LastName'], ['dateOfBirth', 'DateOfBirth'],
    ['homeAddress', 'HomeAddress'], ['riskLevel', 'RiskLevel'], ['caseNumber', 'CaseNumber'],
    ['caseType', 'CaseType'], ['arrestDate', 'ArrestDate'], ['officerInCharge', 'OfficerInCharge'],
    ['courtCaseNumber', 'CourtCaseNumber'], ['drugType', 'DrugType'],
    ['estimatedValue', 'EstimatedValue'], ['storageLocation', 'StorageLocation'],
    ['involvementDetails', 'InvolvementDetails'], ['relationshipType', 'RelationshipType'],
    ['locationRole', 'LocationRole'], ['isPrimary', 'IsPrimary'], ['startDate', 'StartDate'],
    ['addressDetail', 'AddressDetail'], ['locationType', 'LocationType'], ['postalCode', 'PostalCode'],
  ]) {
    assert.equal(normalizeKey(inp), out);
  }
});

test('is idempotent on already-PascalCase keys', () => {
  for (const k of ['PersonID', 'FirstName', 'PhotoURL', 'Status', 'CurrentAddressID']) {
    assert.equal(normalizeKey(k), k);
  }
});

test('normalizeRow converts an API person into the store shape', () => {
  const apiPerson = {
    personId: 1, firstName: 'สมชาย', lastName: 'ดวงดี', nationalId: '1100700123456',
    photoUrl: 'http://x/y.png', riskLevel: 'High', status: 'Arrested', currentAddressId: 5,
  };
  assert.deepEqual(normalizeRow(apiPerson), {
    PersonID: 1, FirstName: 'สมชาย', LastName: 'ดวงดี', NationalID: '1100700123456',
    PhotoURL: 'http://x/y.png', RiskLevel: 'High', Status: 'Arrested', CurrentAddressID: 5,
  });
});

test('values are preserved verbatim (including falsy)', () => {
  const r = normalizeRow({ status: '', quantity: 0, isPrimary: false, notes: null });
  assert.equal(r.Status, '');
  assert.equal(r.Quantity, 0);
  assert.equal(r.IsPrimary, false);
  assert.equal(r.Notes, null);
});

test('normalizeRows / normalizeAllData handle arrays and missing entities', () => {
  assert.deepEqual(normalizeRows([{ caseId: 2 }]), [{ CaseID: 2 }]);
  assert.deepEqual(normalizeRows(undefined), []);
  const all = normalizeAllData({
    persons: [{ personId: 1 }],
    cases: [{ caseId: 2, person1Id: 3 }],
    drugSeizures: [{ seizureId: 9, drugType: 'Meth' }],
    personCases: [{ casePersonId: 4, caseId: 2, personId: 1, role: 'Boss' }],
  });
  assert.deepEqual(all.persons, [{ PersonID: 1 }]);
  assert.deepEqual(all.drugSeizures, [{ SeizureID: 9, DrugType: 'Meth' }]);
  assert.deepEqual(all.personCases, [{ CasePersonID: 4, CaseID: 2, PersonID: 1, Role: 'Boss' }]);
});

test('bad input is handled gracefully', () => {
  assert.equal(normalizeRow(null), null);
  assert.deepEqual(normalizeAllData(null), {});
  assert.deepEqual(normalizeAllData({ persons: null }), { persons: null });
});
