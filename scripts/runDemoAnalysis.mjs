// ============================================================
// Re-run the dashboard analyses on the database dataset and record every
// parameter used — for reporting the expanded demo dataset.
//
//   node scripts/runDemoAnalysis.mjs [--api http://localhost:3001] [--user analyst --pass analyst1234]
//
// Loads /api/all exactly as the dashboard does in DB mode (normalizeAllData),
// then calls the same functions the UI calls with the UI defaults:
//   CrimeMap      → performSpatialAnalysis (KDE + Gi* + Moran's I + ANN), analyzeCorridors
//   NetworkGraph  → degree / betweenness / key-person score
//   StatsPanel    → total cases, active cases, seizure totals by drug type
// Writes server/demo-data/analysis_results.json.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAllData } from '../src/utils/normalizeApi.js';
import {
  performSpatialAnalysis, calculateOptimalBandwidth, calculateAdaptiveThreshold, getAdaptiveResolution, haversineDistance,
} from '../src/utils/spatialAnalysis.js';
import { analyzeCorridors } from '../src/utils/roadNetwork.js';
import { filterCasesByProvince } from '../src/utils/provinceFilter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const API = arg('api', 'http://localhost:3001');
const roads = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/geo/roadsSampran.json'), 'utf8'));

// UI defaults (CrimeMap DEFAULT_PARAMS) and the map's initial zoom (Sam Phran view).
const DEFAULT_ZOOM = 13;
const PARAMS = { kdeBandwidth: null, kdeKernel: 'quartic', kdeResolution: null, giDistanceThreshold: null, giWeightType: 'binary', zoom: DEFAULT_ZOOM };

const login = await fetch(`${API}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: arg('user', 'analyst'), password: arg('pass', 'analyst1234') }),
}).then(r => r.json());
const raw = await fetch(`${API}/api/all`, { headers: { Authorization: `Bearer ${login.accessToken}` } }).then(r => r.json());
const data = normalizeAllData(raw);
const { persons, cases, locations, drugSeizures, personCases } = data;
const personNetwork = data.relationships;
const personLocations = data.personLocations;

// ── CrimeMap: caseLocations → analysisPoints (same aggregation as the component) ──
const buildAnalysisPoints = (selectedProvince) => {
  const scoped = filterCasesByProvince(cases, locations, selectedProvince);
  const caseLocations = scoped.map(c => ({
    ...locations.find(l => l.LocationID === c.LocationID),
    case: c,
    seizures: drugSeizures.filter(s => s.CaseID === c.CaseID),
  }));
  const map = new Map();
  for (const loc of caseLocations) {
    if (!loc.Latitude || !loc.Longitude) continue;
    const key = `${loc.Latitude.toFixed(4)},${loc.Longitude.toFixed(4)}`;
    if (!map.has(key)) map.set(key, { id: loc.LocationID, lat: loc.Latitude, lng: loc.Longitude, caseCount: 0, seizureCount: 0, ...loc });
    const agg = map.get(key);
    agg.caseCount++;
    agg.seizureCount += loc.seizures.length;
  }
  return [...map.values()].map(p => ({ ...p, value: p.caseCount + p.seizureCount, intensity: Math.min(1, (p.caseCount + p.seizureCount) / 5) }));
};

const label = (p) => `${p.AddressDetail}`;
const r3 = (v) => Number(v.toFixed(3));
const r4 = (v) => Number(v.toFixed(4));

const runSpatial = (selectedProvince) => {
  const points = buildAnalysisPoints(selectedProvince);
  const res = performSpatialAnalysis(points, PARAMS);
  const { kde, giStar, moransI, ann } = res;
  const b = kde.bounds;
  const midLat = (b.minLat + b.maxLat) / 2, midLng = (b.minLng + b.maxLng) / 2;
  const cellKmNS = haversineDistance(b.minLat, midLng, b.maxLat, midLng) / kde.resolution;
  const cellKmEW = haversineDistance(midLat, b.minLng, midLat, b.maxLng) / kde.resolution;

  // Densest KDE cells (local peaks, ≥ 1 bandwidth apart) for describing the map.
  const { lats, lngs, density, rows, cols } = kde.grid;
  const order = [...density.keys()].sort((a, b2) => density[b2] - density[a]);
  const peaks = [];
  for (const idx of order) {
    if (peaks.length >= 5) break;
    const lat = lats[idx], lng = lngs[idx];
    if (peaks.some(p => haversineDistance(p.lat, p.lng, lat, lng) < kde.bandwidth)) continue;
    const nearest = points.reduce((best, p) => {
      const d = haversineDistance(lat, lng, p.lat, p.lng);
      return d < best.d ? { d, p } : best;
    }, { d: Infinity, p: null });
    peaks.push({ lat: r4(lat), lng: r4(lng), relativeDensity: r3(density[idx] / kde.maxDensity), nearestSite: label(nearest.p), subDistrict: nearest.p.SubDistrict });
  }

  const hot = giStar.results.filter(r => r.isHotspot).sort((a, b2) => b2.zScore - a.zScore);
  const cold = giStar.results.filter(r => r.isColdspot).sort((a, b2) => a.zScore - b2.zScore);
  const giRow = (r) => ({ site: label(r), subDistrict: r.SubDistrict, district: r.District, cases: r.caseCount, seizures: r.seizureCount, value: r.value, neighbors: r.neighborsCount, z: r3(r.zScore), p: r4(r.pValue), confidence: r.confidenceLevel });

  const corridors = analyzeCorridors(roads.features, points);
  const corridorRoads = corridors.segments.map(seg => {
    // Name each corridor segment by the road whose vertices it lies on.
    const onRoad = roads.features.find(f => f.geometry.coordinates.some(([x, y]) => Math.abs(x - seg.from[1]) < 1e-9 && Math.abs(y - seg.from[0]) < 1e-9)
      && f.geometry.coordinates.some(([x, y]) => Math.abs(x - seg.to[1]) < 1e-9 && Math.abs(y - seg.to[0]) < 1e-9));
    return { road: onRoad?.properties?.NAME || 'จุดเชื่อมระหว่างถนน', from: seg.from, to: seg.to, count: seg.count, weight: r3(seg.weight), lengthKm: r3(haversineDistance(seg.from[0], seg.from[1], seg.to[0], seg.to[1])) };
  });
  const byRoad = {};
  for (const s of corridorRoads) {
    byRoad[s.road] ||= { road: s.road, segments: 0, lengthKm: 0, maxCount: 0, trips: 0 };
    byRoad[s.road].segments++; byRoad[s.road].lengthKm += s.lengthKm; byRoad[s.road].trips += s.count;
    byRoad[s.road].maxCount = Math.max(byRoad[s.road].maxCount, s.count);
  }
  const corridorSummary = Object.values(byRoad).map(x => ({ ...x, lengthKm: r3(x.lengthKm) })).sort((a, b2) => b2.maxCount - a.maxCount || b2.trips - a.trips);
  const top12 = [...points].sort((a, b2) => b2.value - a.value).slice(0, 12).map(p => ({ site: label(p), value: p.value, cases: p.caseCount, seizures: p.seizureCount }));

  return {
    scope: selectedProvince ? `จังหวัด${selectedProvince.th}` : 'ทุกพื้นที่ (ค่าเริ่มต้นของแดชบอร์ด)',
    casesInScope: filterCasesByProvince(cases, locations, selectedProvince).length,
    analysisPoints: points.length,
    pointValue: { definition: 'value = จำนวนคดี + จำนวนรายการของกลาง ณ พิกัดเดียวกัน (ปัดพิกัด 4 ตำแหน่ง)', min: Math.min(...points.map(p => p.value)), max: Math.max(...points.map(p => p.value)), mean: r3(points.reduce((t, p) => t + p.value, 0) / points.length) },
    kde: {
      kernel: kde.kernel, bandwidthKm: r3(kde.bandwidth), bandwidthRule: 'Silverman (robust): h = 0.9 × min(σ, IQR/1.34) × n^(-1/5) จำกัดช่วง 1-50 กม.',
      resolution: kde.resolution, resolutionRule: `อัตโนมัติตามระดับซูม: round(50 × 1.3^(zoom-10)) ที่ zoom ${DEFAULT_ZOOM}`,
      gridCells: `${kde.grid.rows} × ${kde.grid.cols}`, cellSizeKm: { northSouth: r3(cellKmNS), eastWest: r3(cellKmEW) },
      bounds: { minLat: r4(b.minLat), maxLat: r4(b.maxLat), minLng: r4(b.minLng), maxLng: r4(b.maxLng) },
      weights: 'น้ำหนักจุด = value', maxDensity: r4(kde.maxDensity), peaks,
    },
    giStar: {
      distanceBandKm: r3(giStar.summary.distanceThreshold), distanceRule: 'อัตโนมัติ: min(ระยะเพื่อนบ้านใกล้สุดเฉลี่ย × 2.5, เส้นทแยงขอบเขต/4, 15 กม.) ต่ำสุด 1 กม.',
      weightType: giStar.summary.weightType, globalMean: r3(giStar.summary.globalMean), globalStdDev: r3(giStar.summary.globalStdDev),
      counts: {
        hot99: giStar.summary.hotspots99, hot95: giStar.summary.hotspots95, hot90: giStar.summary.hotspots90,
        cold90: giStar.summary.coldspots90, cold95: giStar.summary.coldspots95, cold99: giStar.summary.coldspots99,
        notSignificant: giStar.summary.notSignificant, totalHot: giStar.summary.totalHotspots, totalCold: giStar.summary.totalColdspots,
      },
      hotspots: hot.map(giRow), coldspots: cold.map(giRow),
    },
    moransI: { I: r4(moransI.I), expectedI: r4(moransI.expectedI), variance: Number(moransI.variance.toExponential(4)), z: r3(moransI.zScore), p: Number(moransI.pValue.toPrecision(4)), pattern: moransI.pattern, distanceBandKm: r3(moransI.distanceThreshold), weights: 'binary ภายใน distance band, row-standardized, ไม่รวมตัวเอง', n: moransI.n },
    ann: { observedKm: r4(ann.observedMeanDistance), expectedKm: r4(ann.expectedMeanDistance), R: r4(ann.nnRatio), z: r3(ann.zScore), p: Number(ann.pValue.toPrecision(4)), pattern: ann.pattern, areaKm2: r3(ann.area) },
    corridors: {
      method: 'สร้างกราฟจากชั้นถนนสามพราน (roadsSampran) → snap จุดที่มี value สูงสุด 12 จุดเข้าโหนดถนนที่ใกล้ที่สุด → Dijkstra ทุกคู่ → นับจำนวนเส้นทางที่ผ่านแต่ละช่วงถนน',
      roadNetwork: { features: corridors.diagnostics.roadFeatureCount, nodes: corridors.diagnostics.roadNodeCount },
      inputPoints: top12, snappedNodes: corridors.activityNodes, reachablePairs: corridors.diagnostics.reachablePairCount,
      candidatePairs: corridors.diagnostics.candidatePairCount, segmentCount: corridorRoads.length,
      byRoad: corridorSummary, topSegments: corridorRoads.slice(0, 10),
    },
  };
};

// ── NetworkGraph: computeNetworkMetrics (copied verbatim from the component) ──
function computeNetworkMetrics(nodes, links) {
  const adjacency = new Map();
  nodes.forEach(n => adjacency.set(n.id, new Set()));
  links.forEach(l => { adjacency.get(l.source)?.add(l.target); adjacency.get(l.target)?.add(l.source); });
  const degreeCentrality = {};
  adjacency.forEach((neighbors, id) => { degreeCentrality[id] = neighbors.size / Math.max(1, nodes.length - 1); });
  const betweenness = {};
  nodes.forEach(n => (betweenness[n.id] = 0));
  nodes.forEach(source => {
    const stack = [], predecessors = new Map(), sigma = new Map(), dist = new Map(), delta = new Map();
    nodes.forEach(n => { predecessors.set(n.id, []); sigma.set(n.id, 0); dist.set(n.id, -1); delta.set(n.id, 0); });
    sigma.set(source.id, 1); dist.set(source.id, 0);
    const queue = [source.id];
    while (queue.length) {
      const v = queue.shift(); stack.push(v);
      (adjacency.get(v) || new Set()).forEach(w => {
        if (dist.get(w) < 0) { queue.push(w); dist.set(w, dist.get(v) + 1); }
        if (dist.get(w) === dist.get(v) + 1) { sigma.set(w, sigma.get(w) + sigma.get(v)); predecessors.get(w).push(v); }
      });
    }
    while (stack.length) {
      const w = stack.pop();
      predecessors.get(w).forEach(v => delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w))));
      if (w !== source.id) betweenness[w] += delta.get(w);
    }
  });
  const normFactor = nodes.length > 2 ? (nodes.length - 1) * (nodes.length - 2) : 1;
  Object.keys(betweenness).forEach(k => (betweenness[k] /= normFactor));
  const visited = new Set(), clusters = [];
  nodes.forEach(node => {
    if (visited.has(node.id)) return;
    const cluster = [], q = [node.id];
    while (q.length) {
      const c = q.shift(); if (visited.has(c)) continue; visited.add(c); cluster.push(c);
      adjacency.get(c)?.forEach(nb => { if (!visited.has(nb)) q.push(nb); });
    }
    clusters.push(cluster);
  });
  const keyPersons = nodes
    .map(n => ({ id: n.id, score: (degreeCentrality[n.id] || 0) * 0.4 + (betweenness[n.id] || 0) * 0.4 + (n.RiskLevel === 'Critical' ? 0.2 : n.RiskLevel === 'High' ? 0.15 : 0.05) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return {
    degreeCentrality, betweenness, clusters, keyPersons, adjacency,
    totalNodes: nodes.length, totalEdges: links.length,
    density: nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0,
    avgDegree: nodes.length > 0 ? (2 * links.length) / nodes.length : 0,
  };
}

const nodes = persons.map(p => ({ id: p.PersonID, name: `${p.FirstName} ${p.LastName}`, ...p }));
const links = personNetwork.map(n => ({ source: n.Person1ID, target: n.Person2ID, type: n.RelationshipType }));
const net = computeNetworkMetrics(nodes, links);
const nodeById = new Map(nodes.map(n => [n.id, n]));
const caseCount = (id) => personCases.filter(pc => pc.PersonID === id).length;
const personRow = (id) => {
  const n = nodeById.get(id);
  return {
    personId: id, name: n.name, alias: n.Alias, risk: n.RiskLevel, status: n.Status,
    degree: net.adjacency.get(id).size, degreeCentrality: r4(net.degreeCentrality[id]), betweenness: r4(net.betweenness[id]),
    keyScore: r4(net.degreeCentrality[id] * 0.4 + net.betweenness[id] * 0.4 + (n.RiskLevel === 'Critical' ? 0.2 : n.RiskLevel === 'High' ? 0.15 : 0.05)),
    cases: caseCount(id), notes: n.Notes,
  };
};
const network = {
  nodes: net.totalNodes, edges: net.totalEdges, density: r4(net.density), avgDegree: r3(net.avgDegree),
  components: net.clusters.length, largestComponent: Math.max(...net.clusters.map(c => c.length)),
  isolatedNodes: net.clusters.filter(c => c.length === 1).length,
  normalisation: 'degree = จำนวนเพื่อนบ้าน/(n-1); betweenness (Brandes) หารด้วย (n-1)(n-2); keyScore = 0.4·degree + 0.4·betweenness + น้ำหนักความเสี่ยง (Critical 0.2, High 0.15, อื่น 0.05)',
  keyPersonsTop5: net.keyPersons.map(k => personRow(k.id)),
  topDegree: [...nodes].sort((a, b) => net.degreeCentrality[b.id] - net.degreeCentrality[a.id]).slice(0, 10).map(n => personRow(n.id)),
  topBetweenness: [...nodes].sort((a, b) => net.betweenness[b.id] - net.betweenness[a.id]).slice(0, 10).map(n => personRow(n.id)),
};

// ── StatsPanel (no province filter) ──
const drugStatsAsUi = drugSeizures.reduce((acc, s) => {
  const existing = acc.find(d => d.type === s.DrugType);
  if (existing) existing.totalQuantity += s.Quantity; else acc.push({ type: s.DrugType, totalQuantity: s.Quantity, unit: s.Unit });
  return acc;
}, []).sort((a, b) => b.totalQuantity - a.totalQuantity);
const byDrugUnit = {};
for (const s of drugSeizures) {
  const k = `${s.DrugType}|${s.Unit}`;
  byDrugUnit[k] ||= { drugType: s.DrugType, unit: s.Unit, batches: 0, totalQuantity: 0, estimatedValueTHB: 0 };
  byDrugUnit[k].batches++; byDrugUnit[k].totalQuantity += Number(s.Quantity); byDrugUnit[k].estimatedValueTHB += Number(s.EstimatedValue || 0);
}
const stats = {
  totalCases: cases.length,
  activeCases: cases.filter(c => c.Status === 'Under Investigation').length,
  activeCasesDefinition: "นับเฉพาะ Status = 'Under Investigation' (ตามโค้ด StatsPanel)",
  caseStatus: cases.reduce((t, c) => ({ ...t, [c.Status]: (t[c.Status] || 0) + 1 }), {}),
  totalPersons: persons.length,
  arrests: persons.filter(p => p.Status === 'Arrested').length,
  activeTargets: persons.filter(p => ['Active', 'Suspect'].includes(p.Status)).length,
  seizureBatches: drugSeizures.length,
  seizuresByDrugAndUnit: Object.values(byDrugUnit).map(x => ({ ...x, totalQuantity: r3(x.totalQuantity) })).sort((a, b) => b.batches - a.batches),
  seizureAnalysisAsComputedByUi: drugStatsAsUi.map(d => ({ type: d.type, unit: d.unit, totalQuantity: d.totalQuantity, typeofTotal: typeof d.totalQuantity })),
};

const result = {
  generatedAt: new Date().toISOString(),
  dataset: { cases: cases.length, persons: persons.length, drugSeizures: drugSeizures.length, casePersons: personCases.length, relationships: personNetwork.length, personLocations: personLocations.length, locations: locations.length },
  parameters: { ...PARAMS, note: 'ค่าเริ่มต้นของแผง Analysis: bandwidth/resolution/distance band = Auto, kernel = quartic, weight = binary' },
  spatial: runSpatial(null),
  spatialNakhonPathom: runSpatial({ th: 'นครปฐม', en: 'Nakhon Pathom' }),
  autoValuesCheck: { bandwidth: r3(calculateOptimalBandwidth(buildAnalysisPoints(null))), distanceThreshold: r3(calculateAdaptiveThreshold(buildAnalysisPoints(null))), resolutionAtZoom13: getAdaptiveResolution(13) },
  network, stats,
};
const outFile = path.join(ROOT, 'server/demo-data/analysis_results.json');
fs.writeFileSync(outFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(`wrote ${path.relative(ROOT, outFile)}`);
