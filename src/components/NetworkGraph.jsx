import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useDataStore, useThemeStore } from '../store/useStore';
import { User, Shield, UserCog, Users, X, Briefcase, Calendar, MapPin, Link2 } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map tile URLs
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

// Custom marker icon for persons
const createPersonIcon = (person, subordinateCount, isSelected) => {
  let bgColor = '#64748b'; // Default gray
  let borderColor = '#fff';
  let emoji = '👤';
  
  if (person.Status === 'Arrested') {
    bgColor = '#ef4444';
    emoji = '⛓️';
  } else if (subordinateCount > 2) {
    bgColor = '#8b5cf6';
    emoji = '👑';
  } else if (subordinateCount > 0) {
    bgColor = '#3b82f6';
    emoji = '⭐';
  }
  
  if (isSelected) {
    borderColor = '#fbbf24';
  }
  
  const size = 32 + (subordinateCount * 6);
  
  return L.divIcon({
    className: 'custom-person-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 3px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        font-size: ${14 + subordinateCount * 2}px;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Get relationship line color and style
const getRelationshipStyle = (type) => {
  switch (type) {
    case 'Boss-Subordinate':
      return { color: '#ef4444', weight: 3, dashArray: null, opacity: 0.8 };
    case 'Business Partner':
      return { color: '#8b5cf6', weight: 2.5, dashArray: null, opacity: 0.7 };
    case 'Financial':
      return { color: '#eab308', weight: 2, dashArray: '10, 5', opacity: 0.7 };
    case 'Courier-Handler':
      return { color: '#22c55e', weight: 2, dashArray: '5, 5', opacity: 0.6 };
    default:
      return { color: '#3b82f6', weight: 2, dashArray: '5, 5', opacity: 0.6 };
  }
};

// Component to fit map bounds to markers
const FitBoundsToMarkers = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [map, positions]);
  
  return null;
};

// Animated connection lines component
const ConnectionLines = ({ links, personPositions, highlightPersonId }) => {
  return (
    <>
      {links.map((link, idx) => {
        const sourcePos = personPositions[link.source];
        const targetPos = personPositions[link.target];
        
        if (!sourcePos || !targetPos) return null;
        
        const style = getRelationshipStyle(link.type);
        const isHighlighted = highlightPersonId === link.source || highlightPersonId === link.target;
        
        return (
          <Polyline
            key={`link-${idx}`}
            positions={[sourcePos, targetPos]}
            pathOptions={{
              color: style.color,
              weight: isHighlighted ? style.weight + 1 : style.weight,
              opacity: isHighlighted ? 1 : style.opacity,
              dashArray: style.dashArray,
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{link.type}</p>
                {link.description && (
                  <p className="text-slate-400 mt-1">{link.description}</p>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};

const NetworkGraph = ({ onPersonSelect, selectedPersonId }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { persons, cases, getCasesForPerson, personNetwork, personLocations, locations } = useDataStore();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredPersonId, setHoveredPersonId] = useState(null);
  
  // Helper functions
  const getPersonById = (id) => persons.find(p => p.PersonID === id);
  const getLocationById = (id) => locations.find(l => l.LocationID === id);

  // Build nodes with location data and links
  const { nodes, links, personPositions, mapCenter, allPositions } = useMemo(() => {
    const nodeMap = new Map();
    const positionMap = {};
    const positions = [];
    
    // Calculate subordinate counts
    const outgoingCount = {};
    personNetwork.forEach(n => {
      outgoingCount[n.Person1ID] = (outgoingCount[n.Person1ID] || 0) + 1;
    });
    
    // Create nodes for all persons with their locations
    persons.forEach(p => {
      // Find person's primary location
      const personLoc = personLocations.find(
        pl => pl.PersonID === p.PersonID && pl.IsPrimary
      ) || personLocations.find(pl => pl.PersonID === p.PersonID);
      
      let lat = null, lng = null;
      if (personLoc) {
        const loc = getLocationById(personLoc.LocationID);
        if (loc) {
          lat = loc.Latitude;
          lng = loc.Longitude;
        }
      }
      
      // Fallback: use CurrentAddressID if available
      if (lat === null && p.CurrentAddressID) {
        const loc = getLocationById(p.CurrentAddressID);
        if (loc) {
          lat = loc.Latitude;
          lng = loc.Longitude;
        }
      }
      
      const node = {
        id: p.PersonID,
        name: `${p.FirstName} ${p.LastName}`,
        alias: p.Alias,
        status: p.Status,
        lat,
        lng,
        subordinateCount: outgoingCount[p.PersonID] || 0,
        ...p
      };
      
      nodeMap.set(p.PersonID, node);
      
      if (lat !== null && lng !== null) {
        positionMap[p.PersonID] = [lat, lng];
        positions.push([lat, lng]);
      }
    });

    // Create links from network
    const links = personNetwork.map(n => ({
      source: n.Person1ID,
      target: n.Person2ID,
      type: n.RelationshipType,
      description: n.Evidence || n.Notes,
      strength: n.Strength
    }));

    const nodes = Array.from(nodeMap.values());
    
    // Calculate map center
    let center = [15.0, 101.0]; // Default Thailand center
    if (positions.length > 0) {
      const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
      const avgLng = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
      center = [avgLat, avgLng];
    }

    return { 
      nodes, 
      links, 
      personPositions: positionMap, 
      mapCenter: center,
      allPositions: positions 
    };
  }, [persons, personNetwork, personLocations, locations]);

  const handleMarkerClick = (node) => {
    setSelectedNode(node);
    if (onPersonSelect) onPersonSelect(node);
  };

  const closeDetails = () => {
    setSelectedNode(null);
  };

  const personCases = selectedNode ? getCasesForPerson(selectedNode.id) : [];
  
  // Get connected person IDs for highlighting
  const getConnectedPersonIds = (personId) => {
    const connected = new Set([personId]);
    links.forEach(l => {
      if (l.source === personId) connected.add(l.target);
      if (l.target === personId) connected.add(l.source);
    });
    return connected;
  };
  
  const highlightedIds = hoveredPersonId ? getConnectedPersonIds(hoveredPersonId) : null;

  // Get tile based on theme  
  const tileConfig = isDark ? MAP_TILES.dark : MAP_TILES.light;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={6}
        className="w-full h-full"
        style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        
        {allPositions.length > 0 && (
          <FitBoundsToMarkers positions={allPositions} />
        )}
        
        {/* Connection lines between related persons */}
        <ConnectionLines 
          links={links} 
          personPositions={personPositions} 
          highlightPersonId={hoveredPersonId}
        />
        
        {/* Person markers */}
        {nodes.map(node => {
          if (node.lat === null || node.lng === null) return null;
          
          const isSelected = selectedPersonId === node.id || selectedNode?.id === node.id;
          const isHighlighted = highlightedIds ? highlightedIds.has(node.id) : true;
          
          return (
            <Marker
              key={node.id}
              position={[node.lat, node.lng]}
              icon={createPersonIcon(node, node.subordinateCount, isSelected)}
              opacity={isHighlighted ? 1 : 0.4}
              eventHandlers={{
                click: () => handleMarkerClick(node),
                mouseover: () => setHoveredPersonId(node.id),
                mouseout: () => setHoveredPersonId(null),
              }}
            >
              <Popup>
                <div className={`min-w-[200px] ${isDark ? 'text-slate-800' : 'text-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="font-bold">{node.name}</span>
                  </div>
                  <p className="text-sm text-slate-500">"{node.alias}"</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      node.status === 'Arrested' ? 'bg-red-100 text-red-700' :
                      node.status === 'Active' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {node.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      node.RiskLevel === 'Critical' ? 'bg-purple-100 text-purple-700' :
                      node.RiskLevel === 'High' ? 'bg-red-100 text-red-700' :
                      node.RiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {node.RiskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {node.subordinateCount > 0 
                      ? `Commands ${node.subordinateCount} subordinate(s)` 
                      : 'Street-level member'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className={`absolute top-4 left-4 z-[1000] rounded-lg p-3 shadow-lg backdrop-blur-sm
        ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-gray-900'}`}>
        <p className="text-xs font-semibold mb-2 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Network Legend
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[8px]">👑</div>
            <span>Boss (3+ subordinates)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px]">⭐</div>
            <span>Manager (1-2 subordinates)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center text-[8px]">👤</div>
            <span>Member</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px]">⛓️</div>
            <span>Arrested</span>
          </div>
          <div className={`border-t pt-1.5 mt-1.5 ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
            <p className="text-[10px] font-medium mb-1">Connections</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span>Boss-Subordinate</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="w-6 h-0.5 bg-purple-500"></div>
              <span>Business Partner</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="w-6 h-0.5 bg-yellow-500" style={{ background: 'repeating-linear-gradient(90deg, #eab308, #eab308 4px, transparent 4px, transparent 8px)' }}></div>
              <span>Financial</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <div className="w-6 h-0.5 bg-green-500" style={{ background: 'repeating-linear-gradient(90deg, #22c55e, #22c55e 2px, transparent 2px, transparent 4px)' }}></div>
              <span>Courier-Handler</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected person details panel */}
      {selectedNode && (
        <div className={`absolute top-4 right-4 z-[1000] rounded-lg p-4 shadow-lg backdrop-blur-sm w-80 max-h-[80%] overflow-y-auto
          ${isDark ? 'bg-slate-900/95 text-white' : 'bg-white/95 text-gray-900'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              Person Profile
            </h3>
            <button 
              onClick={closeDetails}
              className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Info */}
            <div>
              <h4 className="text-xl font-bold">{selectedNode.name}</h4>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>"{selectedNode.alias}"</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedNode.status === 'Arrested' ? 'bg-red-500/20 text-red-400' :
                  selectedNode.status === 'Active' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {selectedNode.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedNode.RiskLevel === 'Critical' ? 'bg-purple-500/20 text-purple-400' :
                  selectedNode.RiskLevel === 'High' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {selectedNode.RiskLevel} Risk
                </span>
              </div>
            </div>

            {/* Personal Details */}
            <div className={`rounded-lg p-3 space-y-2 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2 text-sm">
                <Shield className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>National ID:</span>
                <span className="font-mono">{selectedNode.NationalID}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>DOB:</span>
                <span>{selectedNode.DateOfBirth}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Gender:</span>
                <span>{selectedNode.Gender === 'M' ? 'Male' : 'Female'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className={`w-4 h-4 mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>Location:</span>
                <span className="text-xs">{selectedNode.lat?.toFixed(4)}, {selectedNode.lng?.toFixed(4)}</span>
              </div>
            </div>

            {/* Network Position */}
            <div>
              <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <UserCog className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                Network Position
              </h5>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {selectedNode.subordinateCount > 2 
                  ? '🔴 High-level Boss - Commands multiple subordinates'
                  : selectedNode.subordinateCount > 0 
                  ? '🟡 Mid-level Manager - Oversees operations'
                  : '🟢 Street-level Member'}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                Direct subordinates: {selectedNode.subordinateCount}
              </p>
            </div>

            {/* Associated Cases */}
            {personCases.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  Associated Cases ({personCases.length})
                </h5>
                <div className="space-y-2">
                  {personCases.map(c => (
                    <div key={c.CaseID} className={`rounded p-2 ${isDark ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">{c.CaseNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          c.Status === 'Under Investigation' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {c.Status}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{c.CaseType}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persons without location warning */}
      {nodes.some(n => n.lat === null) && (
        <div className={`absolute bottom-4 left-4 z-[1000] rounded-lg p-2 text-xs shadow-lg backdrop-blur-sm
          ${isDark ? 'bg-yellow-900/80 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
          <span className="font-medium">⚠️ {nodes.filter(n => n.lat === null).length} person(s) without location data</span>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
