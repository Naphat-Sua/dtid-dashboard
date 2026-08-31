import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistance,
  performMoransI,
  performANN,
  performGetisOrdGiStar,
  performKDE,
  performSpatialAnalysis,
} from './spatialAnalysis.js';

const clustered = [];
[[13.72, 100.21], [13.80, 100.30], [13.60, 100.10]].forEach(([la, lo], k) => {
  for (let i = 0; i < 8; i++) clustered.push({ lat: la + (i % 3) * 0.002, lng: lo + Math.floor(i / 3) * 0.002, value: 5 + k });
});
const grid = [];
for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) grid.push({ lat: 13.5 + a * 0.05, lng: 100.0 + b * 0.05, value: 3 });
const autocorr = [];
for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) autocorr.push({ lat: 13.5 + a * 0.03, lng: 100.0 + b * 0.03, value: b < 3 ? 10 : 1 });

describe('haversineDistance', () => {
  it('is ~0 for the same point', () => {
    assert.ok(haversineDistance(13.72, 100.21, 13.72, 100.21) < 1e-6);
  });
  it('~1.11 km per 0.01deg latitude', () => {
    const d = haversineDistance(13.7, 100.2, 13.71, 100.2);
    assert.ok(d > 1.0 && d < 1.2, `got ${d}`);
  });
});

describe("Moran's I", () => {
  it('detects positive autocorrelation (Clustered)', () => {
    const r = performMoransI(autocorr);
    assert.ok(r.I > 0, `I=${r.I}`);
    assert.equal(r.pattern, 'Clustered');
    assert.equal(r.significant, true);
  });
  it('E[I] = -1/(n-1)', () => {
    const r = performMoransI(grid);
    assert.ok(Math.abs(r.expectedI - (-1 / (grid.length - 1))) < 1e-6);
  });
  it('guards n < 3', () => {
    assert.equal(performMoransI([{ lat: 1, lng: 1, value: 1 }]).pattern, 'Insufficient data');
  });
});

describe('Average Nearest Neighbor', () => {
  it('flags clustered points (R < 1)', () => {
    const r = performANN(clustered);
    assert.ok(r.nnRatio < 1, `R=${r.nnRatio}`);
    assert.equal(r.pattern, 'Clustered');
  });
  it('flags a regular grid as dispersed (R >= 1)', () => {
    assert.ok(performANN(grid).nnRatio >= 1);
  });
  it('guards n < 3', () => {
    assert.equal(performANN([{ lat: 1, lng: 1, value: 1 }]).pattern, 'Insufficient data');
  });
});

describe('Getis-Ord Gi*', () => {
  it('returns a result per point with z-scores + summary', () => {
    const { results, summary } = performGetisOrdGiStar(clustered);
    assert.equal(results.length, clustered.length);
    assert.ok(results.every((r) => typeof r.zScore === 'number'));
    assert.ok('totalHotspots' in summary);
  });
});

describe('KDE / orchestrator', () => {
  it('KDE produces a positive max density', () => {
    assert.ok(performKDE(clustered, { resolution: 30 }).maxDensity > 0);
  });
  it('performSpatialAnalysis returns kde + giStar + moransI + ann', () => {
    const res = performSpatialAnalysis(clustered);
    for (const k of ['kde', 'giStar', 'moransI', 'ann']) assert.ok(k in res, `missing ${k}`);
  });
});
