import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { 
  MapPin, AlertTriangle, Home, Package, User, Calendar, Scale,
  Flame, Snowflake, BarChart3, Layers, Info, TrendingUp, TrendingDown
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../store/useStore';
import { 
  performSpatialAnalysis, 
  getHotspotColor, 
  getClassificationLabel,
  performKDE 
} from '../utils/spatialAnalysis';

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

// Custom marker icons
const createCustomIcon = (type) => {
  const colors = {
    CrimeScene: { bg: '#ef4444', border: '#fca5a5' },
    Home: { bg: '#3b82f6', border: '#93c5fd' },
    DropOff: { bg: '#eab308', border: '#fde047' },
  };

  const color = colors[type] || colors.Home;

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color.bg};
        border: 3px solid ${color.border};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          ${type === 'CrimeScene' 
            ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'
            : type === 'Home'
            ? '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
            : '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>'
          }
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Heatmap Layer Component - Refined with precise hyperparameters
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create heat layer with refined hyperparameters:
    // - Radius: 55px (slightly larger influence per data point)
    // - Blur: 30 (smooth gradient between hotspots)
    // - Max: 0.6 (lower saturation cap so medium-density shows hot colors)
    // - Weight: 1.5x multiplier on all crime events
    const heatData = points.map(p => [p.lat, p.lng, (p.intensity || 0.5) * 1.5]); // 1.5x weight multiplier
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 55,         // Slightly larger for better coverage
      blur: 30,           // Smoother gradient between hotspots
      maxZoom: 17,        // Maintain intensity at higher zoom levels
      max: 0.6,           // Lower saturation cap - medium density shows hot colors
      minOpacity: 0.3,    // Ensure visibility even at edges
      gradient: {         // Fiery red gradient
        0.0: '#fef3c7',   // Light amber
        0.15: '#fcd34d',  // Yellow
        0.3: '#f97316',   // Orange
        0.45: '#ea580c',  // Dark orange
        0.6: '#dc2626',   // Red
        0.75: '#b91c1c',  // Dark red
        0.9: '#991b1b',   // Darker red
        1.0: '#7f1d1d'    // Very dark red
      }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
};

// Helper function for density colors with smooth interpolation
const getDensityColor = (normalizedDensity) => {
  if (normalizedDensity > 0.8) return '#7f1d1d';  // Very high - dark red
  if (normalizedDensity > 0.6) return '#991b1b';  // High - darker red  
  if (normalizedDensity > 0.45) return '#dc2626'; // Medium-high - red
  if (normalizedDensity > 0.3) return '#ef4444';  // Medium - lighter red
  if (normalizedDensity > 0.2) return '#f97316';  // Low-medium - orange
  return '#fbbf24'; // Low - amber/yellow
};

// KDE Density Layer - Smooth radial gradients centered on data points
const KDEDensityLayer = ({ kdeResult, opacity = 0.6, points = [] }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Remove existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    // Create smooth density visualization using concentric circles at each data point
    // This creates a more natural, organic look than a grid
    const circles = [];
    
    // Aggregate points by location to get density weights
    const locationMap = new Map();
    points.forEach(p => {
      const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, { lat: p.lat, lng: p.lng, weight: 0 });
      }
      locationMap.get(key).weight += (p.value || p.intensity || 1);
    });
    
    const locations = Array.from(locationMap.values());
    const maxWeight = Math.max(...locations.map(l => l.weight));
    
    // Create layered rings for each location (inner = more intense)
    const ringConfigs = [
      { radiusMultiplier: 1.0, opacityMultiplier: 0.15, color: '#fbbf24' },  // Outer - amber
      { radiusMultiplier: 0.75, opacityMultiplier: 0.25, color: '#f97316' }, // Orange
      { radiusMultiplier: 0.55, opacityMultiplier: 0.35, color: '#ef4444' }, // Light red
      { radiusMultiplier: 0.38, opacityMultiplier: 0.45, color: '#dc2626' }, // Red
      { radiusMultiplier: 0.22, opacityMultiplier: 0.55, color: '#991b1b' }, // Dark red
      { radiusMultiplier: 0.1, opacityMultiplier: 0.65, color: '#7f1d1d' },  // Core - darkest
    ];
    
    // Sort locations by weight so larger ones are drawn first (appear behind)
    locations.sort((a, b) => b.weight - a.weight);
    
    locations.forEach(loc => {
      const normalizedWeight = loc.weight / maxWeight;
      // Base radius scales with weight: 3km to 15km
      const baseRadius = 3000 + (normalizedWeight * 12000);
      
      // Draw concentric rings from outside to inside
      ringConfigs.forEach(ring => {
        const circle = L.circle([loc.lat, loc.lng], {
          radius: baseRadius * ring.radiusMultiplier,
          fillColor: ring.color,
          fillOpacity: opacity * ring.opacityMultiplier * (0.5 + normalizedWeight * 0.5),
          stroke: false,
          interactive: false
        });
        circles.push(circle);
      });
    });

    layerRef.current = L.layerGroup(circles).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, points, opacity]);

  return null;
};

// Gi* Hotspot Markers Layer
const HotspotLayer = ({ giResults, onMarkerClick }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  if (!giResults || !giResults.results) return null;

  return (
    <>
      {giResults.results.map((point, idx) => {
        const size = 30 + Math.abs(point.zScore) * 8;
        
        return (
          <CircleMarker
            key={`hotspot-${idx}`}
            center={[point.lat, point.lng]}
            radius={Math.min(size / 3, 20)}
            pathOptions={{
              fillColor: getHotspotColor(point.zScore, 1),
              fillOpacity: 0.7,
              color: point.isHotspot ? '#fff' : point.isColdspot ? '#bfdbfe' : '#9ca3af',
              weight: 2
            }}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(point)
            }}
          >
            <Popup>
              <div className={`min-w-[220px] ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {point.isHotspot ? (
                    <Flame className="w-5 h-5 text-red-500" />
                  ) : point.isColdspot ? (
                    <Snowflake className="w-5 h-5 text-blue-500" />
                  ) : (
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-semibold text-sm">
                    {getClassificationLabel(point.zScore)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crime Count:</span>
                    <span className="font-mono font-medium">{point.value || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gi* Z-Score:</span>
                    <span className={`font-mono font-medium ${
                      point.isHotspot ? 'text-red-400' : 
                      point.isColdspot ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {point.zScore.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">P-Value:</span>
                    <span className="font-mono">
                      {point.pValue < 0.001 ? '<0.001' : point.pValue.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence:</span>
                    <span className={`font-medium ${
                      point.confidenceLevel >= 99 ? 'text-green-400' :
                      point.confidenceLevel >= 95 ? 'text-yellow-400' :
                      point.confidenceLevel >= 90 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {point.confidenceLevel > 0 ? `${point.confidenceLevel}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Neighbors:</span>
                    <span>{point.neighborsCount}</span>
                  </div>
                </div>

                <div className={`mt-3 pt-2 border-t ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
                  <p className="text-[10px] text-slate-500">
                    {point.isHotspot 
                      ? '⚠️ Statistically significant high-crime cluster'
                      : point.isColdspot
                      ? '✓ Statistically significant low-crime area'
                      : 'No significant clustering pattern detected'}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

// Analysis Statistics Panel
const AnalysisStatsPanel = ({ giResults, kdeResult, isDark }) => {
  if (!giResults) return null;

  const { summary } = giResults;

  return (
    <div className={`absolute top-4 right-4 z-[1000] rounded-lg p-4 shadow-lg backdrop-blur-sm
      ${isDark ? 'bg-slate-900/90 text-white' : 'bg-white/90 text-gray-900'}`}
      style={{ maxWidth: '280px' }}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600">
        <BarChart3 className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
        <h3 className="font-semibold text-sm">Getis-Ord Gi* Analysis</h3>
      </div>

      {/* Hotspot Summary */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          <span className="font-medium">Hotspots (High-Risk)</span>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>99% Confidence:</span>
            <span className="font-mono text-red-400">{summary.hotspots99}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>95% Confidence:</span>
            <span className="font-mono text-orange-400">{summary.hotspots95}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>90% Confidence:</span>
            <span className="font-mono text-yellow-400">{summary.hotspots90}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Snowflake className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Coldspots (Low-Risk)</span>
        </div>
        <div className="ml-6 space-y-1">
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>99% Confidence:</span>
            <span className="font-mono text-blue-700">{summary.coldspots99}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>95% Confidence:</span>
            <span className="font-mono text-blue-500">{summary.coldspots95}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>90% Confidence:</span>
            <span className="font-mono text-blue-300">{summary.coldspots90}</span>
          </div>
        </div>

        <div className="flex justify-between mt-3 pt-2 border-t border-slate-600">
          <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Not Significant:</span>
          <span className="font-mono text-gray-400">{summary.notSignificant}</span>
        </div>

        {/* Analysis Parameters */}
        <div className="mt-3 pt-2 border-t border-slate-600">
          <p className="text-[10px] text-slate-500 mb-1">Analysis Parameters:</p>
          <div className="flex justify-between text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Total Points:</span>
            <span className="font-mono">{giResults.results?.length || 0}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Distance Threshold:</span>
            <span className="font-mono">{summary.distanceThreshold?.toFixed(2)} km</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Global Mean:</span>
            <span className="font-mono">{summary.globalMean?.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Global Std Dev:</span>
            <span className="font-mono">{summary.globalStdDev?.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fly to location component
const FlyToLocation = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, {
        duration: 1.5
      });
    }
  }, [center, map, zoom]);

  return null;
};

const CrimeMap = ({ flyToLocation, showHeatmap = true, onMarkerClick }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { locations, getCaseLocations, getPersonLocations } = useDataStore();
  
  // Visualization mode state
  const [vizMode, setVizMode] = useState('heatmap'); // 'heatmap' | 'kde' | 'hotspot' | 'all'
  const [showStats, setShowStats] = useState(true);
  
  // Center on Chiang Rai
  const defaultCenter = [20.15, 99.95];
  const defaultZoom = 10;

  const caseLocations = useMemo(() => getCaseLocations(), [getCaseLocations]);
  const personLocations = useMemo(() => getPersonLocations(), [getPersonLocations]);

  // Prepare points for analysis - aggregate by unique location
  const analysisPoints = useMemo(() => {
    // Group cases by location coordinates to aggregate crime counts
    const locationMap = new Map();
    
    caseLocations.forEach(loc => {
      // Use lat,lng as key to aggregate nearby crimes
      const key = `${loc.Latitude.toFixed(4)},${loc.Longitude.toFixed(4)}`;
      
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          id: loc.LocationID,
          lat: loc.Latitude,
          lng: loc.Longitude,
          caseCount: 0,
          seizureCount: 0,
          totalSeizureWeight: 0,
          cases: [],
          seizures: [],
          ...loc
        });
      }
      
      const aggregated = locationMap.get(key);
      aggregated.caseCount++;
      if (loc.seizures) {
        aggregated.seizureCount += loc.seizures.length;
        aggregated.seizures.push(...loc.seizures);
        // Calculate total weight from seizures
        loc.seizures.forEach(s => {
          const weight = parseFloat(s.Quantity) || 0;
          aggregated.totalSeizureWeight += weight;
        });
      }
      if (loc.case) {
        aggregated.cases.push(loc.case);
      }
    });
    
    // Convert to array and calculate value for Gi* analysis
    return Array.from(locationMap.values()).map(loc => ({
      ...loc,
      // Use combined score: case count + seizure count for better variance
      value: loc.caseCount + loc.seizureCount,
      intensity: Math.min(1.0, (loc.caseCount + loc.seizureCount) / 5)
    }));
  }, [caseLocations]);

  // Perform spatial analysis with refined KDE settings
  // Bandwidth increased by ~65% (15km → 25km) to smooth variance and bridge cluster gaps
  const spatialAnalysis = useMemo(() => {
    if (analysisPoints.length < 3) {
      return null;
    }
    return performSpatialAnalysis(analysisPoints, {
      kdeResolution: 80,       // High resolution for denser grid
      giWeightType: 'binary',
      kdeBandwidth: 25         // Increased 65% (was 15) - smooths variance, bridges clusters
    });
  }, [analysisPoints]);

  // Prepare heatmap data from crime scenes - apply 1.5x weight multiplier
  const heatmapPoints = useMemo(() => {
    return analysisPoints.map(p => ({
      lat: p.lat,
      lng: p.lng,
      intensity: Math.min(1.0, (p.intensity || 0.5) * 1.5) // 1.5x weight multiplier
    }));
  }, [analysisPoints]);

  // All locations for markers
  const allLocations = useMemo(() => {
    const locMap = new Map();
    
    // Add case locations
    caseLocations.forEach(loc => {
      if (loc && loc.LocationID && !locMap.has(loc.LocationID)) {
        locMap.set(loc.LocationID, {
          ...loc,
          cases: [loc.case],
          persons: loc.involvedPersons
        });
      } else if (locMap.has(loc.LocationID)) {
        locMap.get(loc.LocationID).cases.push(loc.case);
      }
    });

    // Add all other locations
    locations.forEach(loc => {
      if (!locMap.has(loc.LocationID)) {
        locMap.set(loc.LocationID, {
          ...loc,
          cases: [],
          persons: []
        });
      }
    });

    return Array.from(locMap.values());
  }, [caseLocations, locations]);

  // Get current tile config
  const tileConfig = isDark ? MAP_TILES.dark : MAP_TILES.light;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        key={theme} // Force re-render on theme change
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />

        {/* Visualization Layers based on mode */}
        {(vizMode === 'heatmap' || vizMode === 'all') && showHeatmap && (
          <HeatmapLayer points={heatmapPoints} />
        )}

        {(vizMode === 'kde' || vizMode === 'all') && analysisPoints.length > 0 && (
          <KDEDensityLayer points={analysisPoints} opacity={0.5} />
        )}

        {(vizMode === 'hotspot' || vizMode === 'all') && spatialAnalysis?.giStar && (
          <HotspotLayer giResults={spatialAnalysis.giStar} onMarkerClick={onMarkerClick} />
        )}

        {flyToLocation && (
          <FlyToLocation center={[flyToLocation.lat, flyToLocation.lng]} zoom={flyToLocation.zoom} />
        )}

        {/* Location Markers (shown when not in hotspot-only mode) */}
        {vizMode !== 'hotspot' && allLocations.filter(loc => loc && loc.Latitude && loc.Longitude).map((location) => (
          <Marker
            key={location.LocationID}
            position={[location.Latitude, location.Longitude]}
            icon={createCustomIcon(location.LocationType)}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(location)
            }}
          >
            <Popup>
              <div className="min-w-[250px]">
                <div className="flex items-center gap-2 mb-3">
                  {location.LocationType === 'CrimeScene' && (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  {location.LocationType === 'Home' && (
                    <Home className="w-5 h-5 text-blue-400" />
                  )}
                  {location.LocationType === 'DropOff' && (
                    <Package className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className="font-semibold text-sm">
                    {location.LocationType === 'CrimeScene' ? 'Crime Scene' :
                     location.LocationType === 'Home' ? 'Residence' : 'Drop-off Point'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {location.AddressDetail || location.Address}
                </p>

                {location.cases && location.cases.length > 0 && (
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <p className="text-xs font-medium mb-2">Related Cases:</p>
                    {location.cases.map((c, idx) => (
                      <div key={idx} className="bg-slate-700/50 rounded p-2 mb-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono">{c.CaseNumber}</span>
                          <span className={`badge ${
                            c.Status === 'Under Investigation' ? 'badge-pending' :
                            c.Status === 'Adjudicated' ? 'badge-arrested' : 'badge-active'
                          }`}>
                            {c.Status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">{c.CaseType}</p>
                      </div>
                    ))}
                  </div>
                )}

                {location.persons && location.persons.length > 0 && (
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <p className="text-xs font-medium mb-2">Involved Persons:</p>
                    {location.persons.slice(0, 3).map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs mb-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{p.FirstName} {p.LastName}</span>
                        <span className="text-slate-500">({p.Alias})</span>
                      </div>
                    ))}
                    {location.persons.length > 3 && (
                      <p className="text-xs text-slate-500">+{location.persons.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Visualization Mode Selector */}
      <div className={`absolute top-4 left-4 z-[1000] rounded-lg p-2 shadow-lg backdrop-blur-sm
        ${isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}>
        <div className="flex items-center gap-1 mb-2">
          <Layers className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Analysis Mode
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {[
            { id: 'heatmap', label: 'Heatmap', icon: '🔥' },
            { id: 'kde', label: 'KDE Density', icon: '📊' },
            { id: 'hotspot', label: 'Gi* Hotspot', icon: '📍' },
            { id: 'all', label: 'All Layers', icon: '🗺️' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setVizMode(mode.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${vizMode === mode.id
                  ? isDark 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-blue-600 text-white'
                  : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className={`mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs transition-colors
            ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Info className="w-3 h-3" />
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>
      </div>

      {/* Analysis Statistics Panel */}
      {showStats && (vizMode === 'hotspot' || vizMode === 'all') && spatialAnalysis?.giStar && (
        <AnalysisStatsPanel 
          giResults={spatialAnalysis.giStar} 
          kdeResult={spatialAnalysis.kde}
          isDark={isDark} 
        />
      )}

      {/* Map Legend */}
      <div className={`absolute bottom-4 left-4 z-[1000] rounded-lg p-3 shadow-lg backdrop-blur-sm
        ${isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}>
        <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Legend</p>
        
        {vizMode !== 'hotspot' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300"></div>
              <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Crime Scene</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300"></div>
              <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Residence</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-300"></div>
              <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Drop-off Point</span>
            </div>
          </div>
        )}

        {(vizMode === 'heatmap' || vizMode === 'kde' || vizMode === 'all') && (
          <div className={`mt-3 pt-2 border-t ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {vizMode === 'kde' ? 'KDE Density' : 'Crime Density'}
            </p>
            <div className="h-2 mt-1 rounded bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500"></div>
            <div className={`flex justify-between text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {(vizMode === 'hotspot' || vizMode === 'all') && (
          <div className={`mt-3 pt-2 border-t ${isDark ? 'border-slate-600' : 'border-gray-300'}`}>
            <p className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Gi* Statistical Significance
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-red-800"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Hotspot 99% CI (Z≥2.58)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Hotspot 95% CI (Z≥1.96)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Hotspot 90% CI (Z≥1.65)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Not Significant</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Coldspot 90% CI (Z≤-1.65)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Coldspot 95% CI (Z≤-1.96)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>Coldspot 99% CI (Z≤-2.58)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrimeMap;
