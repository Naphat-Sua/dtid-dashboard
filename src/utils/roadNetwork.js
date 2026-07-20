// ============================================================
// Road Network Analysis (MVP)
// Builds a graph from OSM road LineStrings, snaps high-activity crime points
// to the network, computes shortest paths between them, and tallies how often
// each road segment is traversed — surfacing likely trafficking corridors.
// ============================================================

import { haversineDistance } from './spatialAnalysis.js';

/**
 * Build a routable graph from road LineString features.
 * Vertices within ~100 m are merged so roads connect at intersections.
 */
export function buildRoadGraph(roadFeatures = []) {
  const nodes = [];
  const keyToId = new Map();
  const adjacency = new Map();
  const round = (v) => Math.round(v * 1000) / 1000; // ~100 m merge grid

  const getNode = (lng, lat) => {
    const key = `${round(lat)},${round(lng)}`;
    if (keyToId.has(key)) return keyToId.get(key);
    const id = nodes.length;
    nodes.push({ id, lat, lng });
    keyToId.set(key, id);
    adjacency.set(id, []);
    return id;
  };
  const addEdge = (a, b) => {
    if (a === b) return;
    const w = haversineDistance(nodes[a].lat, nodes[a].lng, nodes[b].lat, nodes[b].lng);
    adjacency.get(a).push({ to: b, w });
    adjacency.get(b).push({ to: a, w });
  };

  for (const f of roadFeatures) {
    const coords = f?.geometry?.coordinates;
    if (!Array.isArray(coords)) continue;
    let prev = null;
    for (const pair of coords) {
      if (!Array.isArray(pair) || pair.length < 2) continue;
      const [lng, lat] = pair;
      const id = getNode(lng, lat);
      if (prev !== null) addEdge(prev, id);
      prev = id;
    }
  }
  return { nodes, adjacency };
}

/** Nearest graph node to a coordinate. */
export function nearestNode(graph, lat, lng) {
  let best = -1, bestD = Infinity;
  for (const nd of graph.nodes) {
    const d = haversineDistance(lat, lng, nd.lat, nd.lng);
    if (d < bestD) { bestD = d; best = nd.id; }
  }
  return { id: best, distanceKm: bestD };
}

/** Dijkstra shortest paths from `source`; O(n²) PQ (fine for demo-scale graphs). */
export function dijkstra(graph, source) {
  const n = graph.nodes.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const done = new Array(n).fill(false);
  dist[source] = 0;
  for (let iter = 0; iter < n; iter++) {
    let u = -1, best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u === -1) break;
    done[u] = true;
    for (const { to, w } of graph.adjacency.get(u)) {
      if (dist[u] + w < dist[to]) { dist[to] = dist[u] + w; prev[to] = u; }
    }
  }
  return { dist, prev };
}

function reconstruct(prev, target) {
  const path = [];
  for (let u = target; u !== -1; u = prev[u]) path.push(u);
  return path.reverse();
}

/**
 * Analyze likely trafficking corridors.
 * @returns {{segments, graph, snapped, activityNodes}} segments sorted by usage
 *   (each: { from:[lat,lng], to:[lat,lng], count, weight:0..1 }).
 */
export function analyzeCorridors(roadFeatures, points = [], options = {}) {
  const { maxPoints = 12 } = options;
  const graph = buildRoadGraph(roadFeatures);
  if (graph.nodes.length < 2 || points.length < 2) {
    return { segments: [], graph, snapped: [], activityNodes: 0 };
  }

  // Rank points by activity and cap to bound the O(k²) path computation.
  const pts = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .sort((a, b) => (b.value || 1) - (a.value || 1))
    .slice(0, maxPoints);
  const snapped = pts.map((p) => ({ lat: p.lat, lng: p.lng, node: nearestNode(graph, p.lat, p.lng).id }));
  const uniqNodes = [...new Set(snapped.map((s) => s.node))];

  const segCount = new Map();
  for (let i = 0; i < uniqNodes.length; i++) {
    const { prev } = dijkstra(graph, uniqNodes[i]);
    for (let j = i + 1; j < uniqNodes.length; j++) {
      const path = reconstruct(prev, uniqNodes[j]);
      if (path.length < 2 || path[0] !== uniqNodes[i]) continue; // unreachable
      for (let k = 0; k + 1 < path.length; k++) {
        const a = path[k], b = path[k + 1];
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        segCount.set(key, (segCount.get(key) || 0) + 1);
      }
    }
  }

  const maxCount = Math.max(1, ...segCount.values());
  const segments = [...segCount.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number);
      return {
        from: [graph.nodes[a].lat, graph.nodes[a].lng],
        to: [graph.nodes[b].lat, graph.nodes[b].lng],
        count,
        weight: count / maxCount,
      };
    })
    .sort((x, y) => y.count - x.count);

  return { segments, graph, snapped, activityNodes: uniqNodes.length };
}
