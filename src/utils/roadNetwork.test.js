import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoadGraph, dijkstra, nearestNode, analyzeCorridors } from './roadNetwork.js';

const roads = [
  { geometry: { type: 'LineString', coordinates: [[100.10, 13.71], [100.20, 13.71], [100.30, 13.71]] } },
  { geometry: { type: 'LineString', coordinates: [[100.20, 13.68], [100.20, 13.71], [100.20, 13.80]] } },
];

describe('roadNetwork', () => {
  it('builds a graph, merging the shared intersection node', () => {
    const g = buildRoadGraph(roads);
    assert.ok(g.nodes.length > 0);
    assert.ok(g.nodes.length < 6, `expected merged intersection, got ${g.nodes.length}`);
  });

  it('dijkstra distances increase along a line', () => {
    const line = [{ geometry: { type: 'LineString', coordinates: [[100.1, 13.71], [100.2, 13.71], [100.3, 13.71]] } }];
    const { dist } = dijkstra(buildRoadGraph(line), 0);
    assert.equal(dist[0], 0);
    assert.ok(dist[1] < dist[2]);
    assert.ok(Number.isFinite(dist[2]));
  });

  it('nearestNode returns the closest vertex', () => {
    const line = [{ geometry: { type: 'LineString', coordinates: [[100.1, 13.71], [100.2, 13.71]] } }];
    assert.equal(nearestNode(buildRoadGraph(line), 13.71, 100.205).id, 1);
  });

  it('analyzeCorridors returns weighted segments (busiest first)', () => {
    const pts = [
      { lat: 13.71, lng: 100.10, value: 5 }, { lat: 13.71, lng: 100.30, value: 4 },
      { lat: 13.80, lng: 100.20, value: 3 }, { lat: 13.68, lng: 100.20, value: 2 },
    ];
    const res = analyzeCorridors(roads, pts);
    assert.ok(res.segments.length > 0);
    assert.ok(res.segments.every((s) => s.weight > 0 && s.weight <= 1));
    assert.equal(res.segments[0].count, Math.max(...res.segments.map((s) => s.count)));
  });

  it('reports why empty road data produces no corridors', () => {
    const result = analyzeCorridors([], [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }]);
    assert.equal(result.segments.length, 0);
    assert.equal(result.diagnostics.reason, 'no-road-network');
    assert.equal(result.diagnostics.roadFeatureCount, 0);
  });

  it('reports activity points that snap to the same road node', () => {
    const line = [{ geometry: { type: 'LineString', coordinates: [[100, 13], [100.01, 13]] } }];
    const result = analyzeCorridors(line, [
      { lat: 13, lng: 100.0001 }, { lat: 13, lng: 100.0002 },
    ]);
    assert.equal(result.segments.length, 0);
    assert.equal(result.diagnostics.connectedNodeCount, 1);
    assert.equal(result.diagnostics.reason, 'activity-points-snap-to-same-node');
  });

  it('counts only connected route pairs in a disconnected network', () => {
    const disconnected = [
      { geometry: { type: 'LineString', coordinates: [[100, 13], [100.01, 13]] } },
      { geometry: { type: 'LineString', coordinates: [[101, 14], [101.01, 14]] } },
    ];
    const result = analyzeCorridors(disconnected, [
      { lat: 13, lng: 100 }, { lat: 13, lng: 100.01 },
      { lat: 14, lng: 101 }, { lat: 14, lng: 101.01 },
    ]);
    assert.ok(result.segments.length > 0);
    assert.equal(result.diagnostics.candidatePairCount, 6);
    assert.equal(result.diagnostics.reachablePairCount, 2);
    assert.equal(result.diagnostics.reason, null);
  });

  it('accepts numeric-string coordinates and MultiLineString roads', () => {
    const multiLine = [{
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [['100.1', '13.71'], ['100.2', '13.71']],
          [['100.2', '13.71'], ['100.3', '13.71']],
        ],
      },
    }];
    const result = analyzeCorridors(multiLine, [
      { lat: '13.71', lng: '100.1', value: '2' },
      { lat: '13.71', lng: '100.3', value: '1' },
    ]);
    assert.equal(result.diagnostics.roadNodeCount, 3);
    assert.ok(result.segments.length > 0);
  });

  it('reports insufficient activity points', () => {
    const result = analyzeCorridors(roads, [{ lat: 13.71, lng: 100.1 }]);
    assert.equal(result.segments.length, 0);
    assert.equal(result.diagnostics.reason, 'not-enough-activity-points');
  });
});
