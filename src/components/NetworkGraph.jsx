import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, useThemeStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { RISK_COLORS } from '../utils/riskLevels';
import {
  User, Shield, Users, X, Briefcase, Calendar, MapPin,
  Link2, Search, Filter, GitBranch, ChevronDown, ChevronRight,
  Zap, Target, BarChart3, ArrowRight, Activity, Network,
  AlertTriangle, Eye, EyeOff
} from 'lucide-react';

// ── Zustand shallow selector ──
const selectNetworkData = (s) => ({
  persons: s.persons,
  personNetwork: s.personNetwork,
  personLocations: s.personLocations,
  locations: s.locations,
  getCasesForPerson: s.getCasesForPerson,
  cases: s.cases,
  personCases: s.personCases,
});

// ── Leaflet icon fix ──
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Map tiles ──
const MAP_TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

// ── Relationship styling ──
const RELATIONSHIP_CONFIG = {
  'Boss-Subordinate': { color: '#ef4444', label: 'Command', icon: '\u{1F451}', dashArray: null },
  'Business Partner': { color: '#8b5cf6', label: 'Partner', icon: '\u{1F91D}', dashArray: null },
  'Financial': { color: '#eab308', label: 'Financial', icon: '\u{1F4B0}', dashArray: '10,5' },
  'Courier-Handler': { color: '#22c55e', label: 'Courier', icon: '\u{1F4E6}', dashArray: '5,5' },
};

const STRENGTH_CONFIG = {
  'Strong': { width: 4, opacity: 0.9, label: 'Strong', glow: 8 },
  'Medium': { width: 2.5, opacity: 0.7, label: 'Medium', glow: 4 },
  'Weak': { width: 1.5, opacity: 0.45, label: 'Weak', glow: 0 },
};

const STATUS_BADGE = {
  'Arrested': { bg: 'rgba(255,69,58,0.12)', color: 'var(--accent-red)', border: 'rgba(255,69,58,0.2)' },
  'Active': { bg: 'rgba(255,159,10,0.12)', color: 'var(--accent-orange)', border: 'rgba(255,159,10,0.2)' },
  'Suspect': { bg: 'rgba(255,204,0,0.12)', color: 'var(--accent-yellow)', border: 'rgba(255,204,0,0.2)' },
  'Released': { bg: 'rgba(48,209,88,0.12)', color: 'var(--accent-green)', border: 'rgba(48,209,88,0.2)' },
};

// ======================================================
//  Network Analytics - Centrality + Clustering
// ======================================================
function computeNetworkMetrics(nodes, links) {
  const adjacency = new Map();
  nodes.forEach(n => adjacency.set(n.id, new Set()));
  links.forEach(l => {
    adjacency.get(l.source)?.add(l.target);
    adjacency.get(l.target)?.add(l.source);
  });

  const degreeCentrality = {};
  adjacency.forEach((neighbors, id) => {
    degreeCentrality[id] = neighbors.size / Math.max(1, nodes.length - 1);
  });

  // Betweenness centrality (Brandes)
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

  // Connected components
  const visited = new Set(), clusters = [], clusterMap = {};
  nodes.forEach(node => {
    if (visited.has(node.id)) return;
    const cluster = [], q = [node.id];
    while (q.length) {
      const c = q.shift(); if (visited.has(c)) continue; visited.add(c); cluster.push(c);
      adjacency.get(c)?.forEach(nb => { if (!visited.has(nb)) q.push(nb); });
    }
    const cid = clusters.length; cluster.forEach(id => (clusterMap[id] = cid)); clusters.push(cluster);
  });

  const keyPersons = nodes
    .map(n => ({
      id: n.id,
      score: (degreeCentrality[n.id] || 0) * 0.4 + (betweenness[n.id] || 0) * 0.4 +
        (n.RiskLevel === 'Critical' ? 0.2 : n.RiskLevel === 'High' ? 0.15 : 0.05),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    degreeCentrality, betweenness, clusters, clusterMap, keyPersons,
    totalNodes: nodes.length, totalEdges: links.length,
    density: nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0,
    avgDegree: nodes.length > 0 ? (2 * links.length) / nodes.length : 0,
  };
}

// ======================================================
//  Leaflet helpers
// ======================================================
const createPersonIcon = (person, subordinateCount, isSelected, riskLevel) => {
  const risk = RISK_COLORS[riskLevel] || RISK_COLORS['Low'];
  let emoji = '\u{1F464}';
  if (person.Status === 'Arrested') emoji = '\u26D3\uFE0F';
  else if (subordinateCount > 2) emoji = '\u{1F451}';
  else if (subordinateCount > 0) emoji = '\u2B50';
  const size = 36 + Math.min(subordinateCount * 5, 20);
  const borderColor = isSelected ? '#fbbf24' : 'rgba(255,255,255,0.85)';
  const borderWidth = isSelected ? 3 : 2;
  const glowShadow = isSelected ? `,0 0 0 5px ${risk.ring}, 0 0 18px ${risk.ring}` : '';
  return L.divIcon({
    className: 'custom-person-icon',
    html: `<div style="width:${size}px;height:${size}px;background:${risk.raw};border:${borderWidth}px solid ${borderColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.45)${glowShadow};font-size:${14 + Math.min(subordinateCount * 2, 6)}px;cursor:pointer;transition:transform 0.25s cubic-bezier(.34,1.56,.64,1),box-shadow 0.3s ease;">${emoji}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2],
  });
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length) map.fitBounds(L.latLngBounds(positions), { padding: [60, 60], maxZoom: 14 });
  }, [map, positions]);
  return null;
};

// ======================================================
//  SVG Overlay - Curved Connection Lines on Map
// ======================================================
const SVGConnectionOverlay = ({ links, personPositions, highlightPersonId, selectedPersonId, onLinkHover, hoveredLinkIdx, theme }) => {
  const map = useMap();
  const svgRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    map.on('move zoom viewreset moveend zoomend', handler);
    return () => map.off('move zoom viewreset moveend zoomend', handler);
  }, [map]);

  const project = useCallback((latlng) => {
    const pt = map.latLngToContainerPoint(L.latLng(latlng));
    return { x: pt.x, y: pt.y };
  }, [map]);

  const buildCurvedPath = useCallback((srcLatLng, tgtLatLng, idx) => {
    const src = project(srcLatLng);
    const tgt = project(tgtLatLng);
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curveFactor = 0.15 + (idx % 3) * 0.05;
    const offset = dist * curveFactor;
    const nx = -dy / (dist || 1);
    const ny = dx / (dist || 1);
    const cx = (src.x + tgt.x) / 2 + nx * offset;
    const cy = (src.y + tgt.y) / 2 + ny * offset;
    return {
      path: `M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`,
      midX: cx, midY: cy, src, tgt, dist,
    };
  }, [project]);

  const getPointOnQuadBezier = useCallback((s, c, t, u) => ({
    x: (1 - u) * (1 - u) * s.x + 2 * (1 - u) * u * c.x + u * u * t.x,
    y: (1 - u) * (1 - u) * s.y + 2 * (1 - u) * u * c.y + u * u * t.y,
  }), []);

  const getAngleOnQuadBezier = useCallback((s, c, t, u) => {
    const ddx = 2 * (1 - u) * (c.x - s.x) + 2 * u * (t.x - c.x);
    const ddy = 2 * (1 - u) * (c.y - s.y) + 2 * u * (t.y - c.y);
    return Math.atan2(ddy, ddx) * (180 / Math.PI);
  }, []);

  const mapSize = map.getSize();

  const edgeIndexMap = useMemo(() => {
    const counts = {};
    const indices = {};
    links.forEach((link, i) => {
      const key = [Math.min(link.source, link.target), Math.max(link.source, link.target)].join('-');
      if (!counts[key]) counts[key] = 0;
      indices[i] = counts[key];
      counts[key]++;
    });
    return indices;
  }, [links]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: mapSize.x,
        height: mapSize.y,
        pointerEvents: 'none',
        zIndex: 450,
      }}
    >
      <defs>
        <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="line-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes flow-dash { to { stroke-dashoffset: -40; } }
        `}</style>
      </defs>

      {links.map((link, idx) => {
        const srcLatLng = personPositions[link.source];
        const tgtLatLng = personPositions[link.target];
        if (!srcLatLng || !tgtLatLng) return null;

        const cfg = RELATIONSHIP_CONFIG[link.type] || { color: '#3b82f6', dashArray: '5,5' };
        const strCfg = STRENGTH_CONFIG[link.strength] || STRENGTH_CONFIG['Medium'];
        const isHl = highlightPersonId === link.source || highlightPersonId === link.target;
        const isSel = selectedPersonId === link.source || selectedPersonId === link.target;
        const isLinkHovered = hoveredLinkIdx === idx;
        const isActive = isHl || isSel || isLinkHovered;
        const shouldDim = (highlightPersonId || selectedPersonId) && !isActive;

        const edgeIdx = edgeIndexMap[idx] || 0;
        const curve = buildCurvedPath(srcLatLng, tgtLatLng, edgeIdx);
        const ctrl = { x: curve.midX, y: curve.midY };
        const arrowPt = getPointOnQuadBezier(curve.src, ctrl, curve.tgt, 0.65);
        const arrowAngle = getAngleOnQuadBezier(curve.src, ctrl, curve.tgt, 0.65);

        const lineWidth = isActive ? strCfg.width + 2 : strCfg.width;
        const lineOpacity = shouldDim ? 0.08 : isActive ? 1 : strCfg.opacity;
        const glowFilter = isActive && strCfg.glow > 0 ? 'url(#line-glow)' : 'none';

        return (
          <g key={`link-${idx}`}>
            {/* Glow underlay for active strong lines */}
            {isActive && strCfg.glow > 0 && (
              <path d={curve.path} fill="none" stroke={cfg.color}
                strokeWidth={lineWidth + strCfg.glow} strokeOpacity={0.2}
                filter="url(#line-glow-strong)" />
            )}

            {/* Invisible hit area for hover interaction */}
            <path d={curve.path} fill="none" stroke="transparent"
              strokeWidth={Math.max(lineWidth + 12, 18)}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => onLinkHover(idx)}
              onMouseLeave={() => onLinkHover(null)} />

            {/* Main visible curved path */}
            <path d={curve.path} fill="none" stroke={cfg.color}
              strokeWidth={lineWidth} strokeOpacity={lineOpacity}
              strokeDasharray={cfg.dashArray || 'none'} strokeLinecap="round"
              style={{ transition: 'stroke-width 0.3s ease, stroke-opacity 0.3s ease', filter: glowFilter }} />

            {/* Animated flow particles on active lines */}
            {isActive && (
              <path d={curve.path} fill="none" stroke={cfg.color}
                strokeWidth={Math.max(lineWidth - 1, 1)} strokeOpacity={0.5}
                strokeDasharray="4,16" strokeLinecap="round"
                style={{ animation: 'flow-dash 1.5s linear infinite' }} />
            )}

            {/* Directional arrow along the curve */}
            <polygon points="-5,-4 7,0 -5,4" fill={cfg.color}
              opacity={shouldDim ? 0.08 : isActive ? 0.95 : 0.55}
              transform={`translate(${arrowPt.x},${arrowPt.y}) rotate(${arrowAngle})`}
              style={{ transition: 'opacity 0.3s ease' }} />

            {/* Tooltip on hover */}
            {isLinkHovered && (
              <g>
                <rect x={curve.midX - 60} y={curve.midY - 30} width={120} height={40} rx={10}
                  fill={theme === 'dark' ? 'rgba(20,20,30,0.92)' : 'rgba(255,255,255,0.95)'}
                  stroke={cfg.color} strokeWidth={1} strokeOpacity={0.4}
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }} />
                <text x={curve.midX} y={curve.midY - 13} textAnchor="middle"
                  fontSize="11" fontWeight="600" fill={cfg.color}>
                  {`${cfg.icon || '\u{1F517}'} ${cfg.label || link.type}`}
                </text>
                <text x={curve.midX} y={curve.midY + 3} textAnchor="middle"
                  fontSize="9" fill={theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'}>
                  {`${link.strength} \u00B7 ${link.description ? link.description.substring(0, 28) + (link.description.length > 28 ? '\u2026' : '') : 'No evidence'}`}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// -- Stat chip --
// eslint-disable-next-line no-unused-vars -- Icon is used as a JSX element below
const StatChip = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: 'var(--glass-thin)' }}>
    <Icon className="w-3.5 h-3.5" style={{ color: accent || 'var(--accent-blue)' }} />
    <div>
      <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  </div>
);

// ======================================================
// ##  MAIN COMPONENT - NetworkGraph (Map-Primary)
// ======================================================
const NetworkGraph = ({ onPersonSelect, selectedPersonId }) => {
  const { persons, personNetwork, personLocations, locations, getCasesForPerson } = useDataStore(useShallow(selectNetworkData));
  const { theme } = useThemeStore();

  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredPersonId, setHoveredPersonId] = useState(null);
  const [hoveredLinkIdx, setHoveredLinkIdx] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [expandedSections, setExpandedSections] = useState({ connections: true, cases: false, evidence: false });

  const getLocationById = useCallback((id) => locations.find(l => l.LocationID === id), [locations]);

  // -- Build full network --
  const { allNodes, allLinks } = useMemo(() => {
    const outgoing = {};
    personNetwork.forEach(n => { outgoing[n.Person1ID] = (outgoing[n.Person1ID] || 0) + 1; });

    const nodeArr = persons.map(p => {
      const ploc = personLocations.find(pl => pl.PersonID === p.PersonID && pl.IsPrimary) || personLocations.find(pl => pl.PersonID === p.PersonID);
      let lat = null, lng = null;
      if (ploc) { const loc = getLocationById(ploc.LocationID); if (loc) { lat = loc.Latitude; lng = loc.Longitude; } }
      if (lat === null && p.CurrentAddressID) { const loc = getLocationById(p.CurrentAddressID); if (loc) { lat = loc.Latitude; lng = loc.Longitude; } }
      return { id: p.PersonID, name: `${p.FirstName} ${p.LastName}`, alias: p.Alias, status: p.Status, lat, lng, subordinateCount: outgoing[p.PersonID] || 0, ...p };
    });

    const linkArr = personNetwork.map(n => ({ source: n.Person1ID, target: n.Person2ID, type: n.RelationshipType, description: n.Evidence || n.Notes, strength: n.Strength }));
    return { allNodes: nodeArr, allLinks: linkArr };
  }, [persons, personNetwork, personLocations, locations, getLocationById]);

  // -- Filtered network --
  const { nodes, links, personPositions, mapCenter, allPositions } = useMemo(() => {
    let fLinks = filterType === 'all' ? allLinks : allLinks.filter(l => l.type === filterType);
    const linkedIds = new Set(); fLinks.forEach(l => { linkedIds.add(l.source); linkedIds.add(l.target); });

    let fNodes = allNodes.filter(n => {
      if (filterType !== 'all' && !linkedIds.has(n.id)) return false;
      if (filterRisk !== 'all' && n.RiskLevel !== filterRisk) return false;
      if (filterStatus !== 'all' && n.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.name.toLowerCase().includes(q) && !(n.alias && n.alias.toLowerCase().includes(q)) && !(n.NationalID && n.NationalID.includes(q))) return false;
      }
      return true;
    });
    const nodeIds = new Set(fNodes.map(n => n.id));
    fLinks = fLinks.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    const posMap = {}, positions = [];
    fNodes.forEach(n => { if (n.lat != null && n.lng != null) { posMap[n.id] = [n.lat, n.lng]; positions.push([n.lat, n.lng]); } });
    let center = [15.0, 101.0];
    if (positions.length) center = [positions.reduce((s, p) => s + p[0], 0) / positions.length, positions.reduce((s, p) => s + p[1], 0) / positions.length];
    return { nodes: fNodes, links: fLinks, personPositions: posMap, mapCenter: center, allPositions: positions };
  }, [allNodes, allLinks, filterType, filterRisk, filterStatus, searchQuery]);

  const metrics = useMemo(() => computeNetworkMetrics(nodes, links), [nodes, links]);

  const getConnectedIds = useCallback((pid) => { const s = new Set([pid]); links.forEach(l => { if (l.source === pid) s.add(l.target); if (l.target === pid) s.add(l.source); }); return s; }, [links]);
  const highlightedIds = hoveredPersonId ? getConnectedIds(hoveredPersonId) : null;

  const handleNodeClick = useCallback((node) => {
    if (!node) { setSelectedNode(null); return; }
    setSelectedNode(node); onPersonSelect?.(node);
  }, [onPersonSelect]);

  const toggleSection = (k) => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return links.filter(l => l.source === selectedNode.id || l.target === selectedNode.id).map(l => {
      const otherId = l.source === selectedNode.id ? l.target : l.source;
      return { ...l, other: nodes.find(n => n.id === otherId) };
    }).filter(l => l.other);
  }, [selectedNode, links, nodes]);

  const selectedCases = selectedNode ? getCasesForPerson(selectedNode.id) : [];
  const tileConfig = theme === 'dark' ? MAP_TILES.dark : MAP_TILES.light;
  const activeFilterCount = [filterType !== 'all', filterRisk !== 'all', filterStatus !== 'all', searchQuery !== ''].filter(Boolean).length;

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* MAP VIEW */}
      <MapContainer center={mapCenter} zoom={6} className="w-full h-full" style={{ background: 'var(--bg-surface)' }} key={`map-${theme}`}>
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {showLines && (
          <SVGConnectionOverlay links={links} personPositions={personPositions}
            highlightPersonId={hoveredPersonId} selectedPersonId={selectedNode?.id}
            onLinkHover={setHoveredLinkIdx} hoveredLinkIdx={hoveredLinkIdx} theme={theme} />
        )}

        {nodes.map(node => {
          if (node.lat == null || node.lng == null) return null;
          const isSel = selectedPersonId === node.id || selectedNode?.id === node.id;
          const isHl = highlightedIds ? highlightedIds.has(node.id) : true;
          return (
            <Marker key={node.id} position={[node.lat, node.lng]}
              icon={createPersonIcon(node, node.subordinateCount, isSel, node.RiskLevel)}
              opacity={isHl ? 1 : 0.25}
              eventHandlers={{
                click: () => handleNodeClick(node),
                mouseover: () => setHoveredPersonId(node.id),
                mouseout: () => setHoveredPersonId(null),
              }}>
              <Popup>
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-bold">{node.name}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{`"${node.alias}"`}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {node.status && <span className="badge badge-suspect text-[10px]">{node.status}</span>}
                    {node.RiskLevel && <span className="badge badge-at-large text-[10px]">{`${node.RiskLevel} Risk`}</span>}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      <strong>Connections:</strong> {links.filter(l => l.source === node.id || l.target === node.id).length}
                      {' \u00B7 '}
                      <strong>Centrality:</strong> {((metrics.betweenness[node.id] || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* No-results overlay — when a search/filter matches nobody */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <Network className="w-4 h-4" />
            ไม่พบบุคคลตามเงื่อนไขที่เลือก
          </div>
        </div>
      )}

      {/* TOP TOOLBAR */}
      <div className="network-toolbar">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)' }}>
          <Network className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>Network</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(10,132,255,0.1)', color: 'var(--accent-blue)' }}>{nodes.length}</span>
        </div>

        <div className="flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search name, alias, ID..." aria-label="ค้นหาบุคคลในเครือข่าย" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-[11px]"
            style={{ background: 'var(--glass-thin)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none' }} />
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={{ background: activeFilterCount > 0 ? 'rgba(10,132,255,0.12)' : 'var(--glass-thin)', color: activeFilterCount > 0 ? 'var(--accent-blue)' : 'var(--text-secondary)', border: `1px solid ${activeFilterCount > 0 ? 'rgba(10,132,255,0.25)' : 'var(--border-subtle)'}` }}>
          <Filter className="w-3.5 h-3.5" />Filters
          {activeFilterCount > 0 && <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--accent-blue)', color: 'white' }}>{activeFilterCount}</span>}
        </button>

        <button onClick={() => setShowLines(!showLines)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={{ background: showLines ? 'rgba(191,90,242,0.12)' : 'var(--glass-thin)', color: showLines ? 'var(--accent-purple)' : 'var(--text-secondary)', border: `1px solid ${showLines ? 'rgba(191,90,242,0.25)' : 'var(--border-subtle)'}` }}>
          {showLines ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Links
        </button>

        <button onClick={() => setShowMetrics(!showMetrics)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
          style={{ background: showMetrics ? 'rgba(48,209,88,0.12)' : 'var(--glass-thin)', color: showMetrics ? 'var(--accent-green)' : 'var(--text-secondary)', border: `1px solid ${showMetrics ? 'rgba(48,209,88,0.25)' : 'var(--border-subtle)'}` }}>
          <BarChart3 className="w-3.5 h-3.5" />Analytics
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="network-filter-panel animate-fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Relationship</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', outline: 'none' }}>
                <option value="all">All Types</option>
                {Object.keys(RELATIONSHIP_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Risk Level</label>
              <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', outline: 'none' }}>
                <option value="all">All Levels</option>
                {Object.keys(RISK_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--glass-regular)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', outline: 'none' }}>
                <option value="all">All Statuses</option>
                {Object.keys(STATUS_BADGE).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={() => { setFilterType('all'); setFilterRisk('all'); setFilterStatus('all'); setSearchQuery(''); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold mt-3.5" style={{ background: 'rgba(255,69,58,0.1)', color: 'var(--accent-red)' }}>
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS PANEL */}
      {showMetrics && (
        <div className="network-metrics-panel animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Network Analytics</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <StatChip icon={Users} label="Nodes" value={metrics.totalNodes} accent="var(--accent-blue)" />
            <StatChip icon={Link2} label="Edges" value={metrics.totalEdges} accent="var(--accent-purple)" />
            <StatChip icon={Activity} label="Density" value={`${(metrics.density * 100).toFixed(1)}%`} accent="var(--accent-teal)" />
            <StatChip icon={GitBranch} label="Clusters" value={metrics.clusters.length} accent="var(--accent-orange)" />
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
              <Target className="w-3 h-3" />KEY PERSONS (by centrality)
            </p>
            <div className="space-y-1">
              {metrics.keyPersons.map((kp, i) => {
                const person = nodes.find(n => n.id === kp.id);
                if (!person) return null;
                return (
                  <button key={kp.id} onClick={() => handleNodeClick(person)}
                    onMouseEnter={() => setHoveredPersonId(kp.id)} onMouseLeave={() => setHoveredPersonId(null)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:scale-[1.01]"
                    style={{ background: selectedNode?.id === kp.id ? 'rgba(10,132,255,0.12)' : 'var(--glass-ultra-thin)' }}>
                    <span className="text-xs font-bold font-mono w-4" style={{ color: 'var(--text-quaternary)' }}>{`#${i + 1}`}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[person.RiskLevel]?.raw || '#30D158' }} />
                    <span className="text-[11px] font-medium flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{person.alias || person.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--glass-thin)', color: 'var(--text-tertiary)' }}>{(kp.score * 100).toFixed(0)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LEGEND */}
      <div className="network-legend">
        <p className="text-[10px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Link2 className="w-3.5 h-3.5" /> Legend
        </p>
        <div className="space-y-1">
          {Object.entries(RISK_COLORS).map(([level, cfg]) => (
            <div key={level} className="flex items-center gap-2 text-[10px]">
              <div className="w-3 h-3 rounded-full" style={{ background: cfg.raw }} />
              <span style={{ color: 'var(--text-secondary)' }}>{level}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>CONNECTIONS</p>
          {Object.entries(RELATIONSHIP_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2 text-[10px] mt-0.5">
              <div className="w-5 h-[2px]" style={{ background: cfg.dashArray ? `repeating-linear-gradient(90deg,${cfg.color},${cfg.color} 3px,transparent 3px,transparent 6px)` : cfg.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{`${cfg.icon} ${cfg.label}`}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>STRENGTH</p>
          {Object.entries(STRENGTH_CONFIG).map(([level, cfg]) => (
            <div key={level} className="flex items-center gap-2 text-[10px] mt-0.5">
              <div className="w-5 rounded-full" style={{ background: 'var(--text-secondary)', height: `${cfg.width}px` }} />
              <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
          <p className="text-[9px] font-semibold mb-1" style={{ color: 'var(--text-tertiary)' }}>ROLES</p>
          {[['\u{1F451}', 'Boss (3+ links)'], ['\u2B50', 'Manager'], ['\u{1F464}', 'Member'], ['\u26D3\uFE0F', 'Arrested']].map(([e, l]) => (
            <div key={l} className="flex items-center gap-2 text-[10px] mt-0.5">
              <span>{e}</span><span style={{ color: 'var(--text-secondary)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL PANEL */}
      {selectedNode && (
        <div className="network-detail-panel animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg"
                style={{ background: RISK_COLORS[selectedNode.RiskLevel]?.raw || 'var(--glass-regular)' }}>
                {selectedNode.status === 'Arrested' ? '\u26D3\uFE0F' : selectedNode.subordinateCount > 2 ? '\u{1F451}' : selectedNode.subordinateCount > 0 ? '\u2B50' : '\u{1F464}'}
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{`"${selectedNode.alias}"`}</p>
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} aria-label="ปิดรายละเอียด" className="p-1 rounded-lg transition-all" style={{ color: 'var(--text-tertiary)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-3">
            {selectedNode.status && (() => { const s = STATUS_BADGE[selectedNode.status] || STATUS_BADGE.Active; return <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{selectedNode.status}</span>; })()}
            {selectedNode.RiskLevel && <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: `${RISK_COLORS[selectedNode.RiskLevel]?.raw}22`, color: RISK_COLORS[selectedNode.RiskLevel]?.raw }}>{`${selectedNode.RiskLevel} Risk`}</span>}
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--glass-thin)', color: 'var(--text-tertiary)' }}>
              {selectedNode.subordinateCount > 2 ? '\u{1F451} Boss' : selectedNode.subordinateCount > 0 ? '\u2B50 Manager' : '\u{1F464} Member'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <div className="text-center px-2 py-1.5 rounded-xl" style={{ background: 'var(--glass-thin)' }}>
              <p className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Degree</p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--accent-blue)' }}>{`${((metrics.degreeCentrality[selectedNode.id] || 0) * 100).toFixed(0)}%`}</p>
            </div>
            <div className="text-center px-2 py-1.5 rounded-xl" style={{ background: 'var(--glass-thin)' }}>
              <p className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Between.</p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--accent-purple)' }}>{`${((metrics.betweenness[selectedNode.id] || 0) * 100).toFixed(1)}%`}</p>
            </div>
            <div className="text-center px-2 py-1.5 rounded-xl" style={{ background: 'var(--glass-thin)' }}>
              <p className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Links</p>
              <p className="text-sm font-bold font-mono" style={{ color: 'var(--accent-orange)' }}>{selectedConnections.length}</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-3 px-2 py-2 rounded-xl" style={{ background: 'var(--glass-ultra-thin)' }}>
            {selectedNode.NationalID && <div className="flex items-center gap-2 text-[11px]"><Shield className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /><span style={{ color: 'var(--text-secondary)' }}>ID:</span><span className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedNode.NationalID}</span></div>}
            {selectedNode.DateOfBirth && <div className="flex items-center gap-2 text-[11px]"><Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /><span style={{ color: 'var(--text-secondary)' }}>DOB:</span><span style={{ color: 'var(--text-primary)' }}>{selectedNode.DateOfBirth}</span></div>}
            {selectedNode.Gender && <div className="flex items-center gap-2 text-[11px]"><Users className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /><span style={{ color: 'var(--text-secondary)' }}>Gender:</span><span style={{ color: 'var(--text-primary)' }}>{selectedNode.Gender === 'M' ? 'Male' : 'Female'}</span></div>}
            {selectedNode.lat != null && selectedNode.lng != null && <div className="flex items-center gap-2 text-[11px]"><MapPin className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /><span style={{ color: 'var(--text-secondary)' }}>Coord:</span><span className="font-mono text-[10px]" style={{ color: 'var(--text-primary)' }}>{`${selectedNode.lat.toFixed(4)}, ${selectedNode.lng.toFixed(4)}`}</span></div>}
          </div>

          {/* Connections */}
          <div className="mb-2">
            <button onClick={() => toggleSection('connections')} className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              <span className="flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />{`Connections (${selectedConnections.length})`}</span>
              {expandedSections.connections ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {expandedSections.connections && (
              <div className="space-y-1.5 mt-1">
                {selectedConnections.map((conn, i) => {
                  const cfg = RELATIONSHIP_CONFIG[conn.type] || {};
                  return (
                    <button key={i} onClick={() => handleNodeClick(conn.other)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all network-connection-item"
                      style={{ background: 'var(--glass-ultra-thin)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color || 'var(--accent-blue)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{conn.other.alias || conn.other.name}</span>
                          <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-quaternary)' }} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-medium" style={{ color: cfg.color || 'var(--text-tertiary)' }}>{`${cfg.icon || ''} ${cfg.label || conn.type}`}</span>
                          <span className="text-[9px]" style={{ color: 'var(--text-quaternary)' }}>{`\u00B7 ${conn.strength}`}</span>
                        </div>
                        {conn.description && <p className="text-[9px] mt-0.5 truncate" style={{ color: 'var(--text-quaternary)' }}>{conn.description}</p>}
                      </div>
                      <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: conn.strength === 'Strong' ? 'var(--accent-green)' : conn.strength === 'Weak' ? 'var(--accent-red)' : 'var(--accent-yellow)', opacity: 0.6 }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cases */}
          {selectedCases.length > 0 && (
            <div className="mb-2">
              <button onClick={() => toggleSection('cases')} className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--accent-orange)' }} />{`Cases (${selectedCases.length})`}</span>
                {expandedSections.cases ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {expandedSections.cases && (
                <div className="space-y-1.5 mt-1">
                  {selectedCases.map(c => (
                    <div key={c.CaseID} className="px-2.5 py-2 rounded-xl" style={{ background: 'var(--glass-ultra-thin)' }}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{c.CaseNumber}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-lg font-medium ${c.Status === 'Under Investigation' ? 'badge-suspect' : c.Status === 'Closed' || c.Status === 'Adjudicated' ? 'badge-active' : 'badge-pending'}`}>{c.Status}</span>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{c.CaseType}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence */}
          {selectedConnections.some(c => c.description) && (
            <div>
              <button onClick={() => toggleSection('evidence')} className="w-full flex items-center justify-between py-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent-yellow)' }} />Evidence</span>
                {expandedSections.evidence ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {expandedSections.evidence && (
                <div className="space-y-1.5 mt-1">
                  {selectedConnections.filter(c => c.description).map((conn, i) => (
                    <div key={i} className="px-2.5 py-2 rounded-xl" style={{ background: 'var(--glass-ultra-thin)' }}>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: RELATIONSHIP_CONFIG[conn.type]?.color || 'var(--text-secondary)' }}>
                        {`${RELATIONSHIP_CONFIG[conn.type]?.icon || ''} ${conn.other?.alias || conn.other?.name} \u2014 ${conn.type}`}
                      </p>
                      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{conn.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No-location warning */}
      {nodes.some(n => n.lat === null) && (
        <div className="absolute bottom-14 left-4 z-[800] rounded-xl px-3 py-1.5 glass-floating text-[10px] flex items-center gap-1.5" style={{ color: 'var(--accent-orange)' }}>
          <AlertTriangle className="w-3 h-3" />{`${nodes.filter(n => n.lat === null).length} person(s) without location`}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
