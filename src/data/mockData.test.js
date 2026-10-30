import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persons, cases, locations, drugSeizures, relationships } from './mockData.js';
import { performSpatialAnalysis } from '../utils/spatialAnalysis.js';

// Records from the 184-case demo workbook use ids from 1001 up; everything below is the original demo.
const isLegacy = (id) => id < 1001;

test('narcotics demo retains all records and relabels the 12 legacy cases', () => {
  assert.deepEqual(
    [persons.filter(p => isLegacy(p.PersonID)).length, cases.filter(c => isLegacy(c.CaseID)).length, drugSeizures.filter(s => isLegacy(s.SeizureID)).length],
    [14, 36, 34],
  );
  const ids = [101, 102, 103, 104, 105, 201, 202, 203, 204, 205, 206, 207];
  ids.forEach((id, index) => {
    const item = cases.find(c => c.CaseID === id);
    assert.ok(item);
    assert.equal(item.CaseNumber, `NCB-CR-2568-${String(321 + index).padStart(4, '0')}`);
    assert.ok(!['Smuggling', 'Forgery', 'Vehicle Theft'].includes(item.CaseType));
  });
  const legacyEvidence = ['Forged Documents', 'Wildlife Contraband', 'Stolen Vehicle Parts', 'Stolen Vehicle'];
  assert.ok(drugSeizures.every(s => !legacyEvidence.includes(s.DrugType)));
});

test('demo spatial results remain 17 points, five 95% hotspots and Moran I 0.367', () => {
  const points = new Map();
  for (const c of cases.filter(x => isLegacy(x.CaseID))) {
    const loc = locations.find(l => l.LocationID === c.LocationID);
    if (!loc?.Latitude || !loc.Longitude) continue;
    const key = `${loc.Latitude.toFixed(4)},${loc.Longitude.toFixed(4)}`;
    if (!points.has(key)) {
      points.set(key, { id: loc.LocationID, lat: loc.Latitude, lng: loc.Longitude, value: 0 });
    }
    points.get(key).value += 1 + drugSeizures.filter(s => s.CaseID === c.CaseID).length;
  }
  const input = [...points.values()];
  assert.equal(input.length, 17);
  const result = performSpatialAnalysis(input, { kdeResolution: 20 });
  assert.equal(result.giStar.summary.hotspots95, 5);
  assert.equal(result.giStar.summary.coldspots90, 1);
  assert.equal(result.moransI.I.toFixed(3), '0.367');
  assert.equal(result.moransI.pattern, 'Clustered');
});

test('demo includes the 184-case workbook: 220 cases, 121 persons, 236 seizures, 79 linked pairs', () => {
  assert.deepEqual([cases.length, persons.length, drugSeizures.length], [220, 121, 236]);
  const pairs = new Set(relationships.map(r => [r.Person1ID, r.Person2ID].sort((a, b) => a - b).join('-')));
  assert.equal(pairs.size, 79);
});
