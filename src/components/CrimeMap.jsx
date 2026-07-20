import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker } from 'react-leaflet';
import L from '../leafletSetup'; // exposes window.L before the leaflet.heat UMD plugin loads
import 'leaflet.heat';
import { 
  MapPin, AlertTriangle, Home, Package, User, Calendar, Scale,
  Flame, Snowflake, BarChart3, Layers, Info, TrendingUp, TrendingDown
} from 'lucide-react';
import { useDataStore, useThemeStore } from '../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { 
  performSpatialAnalysis,
  getHotspotColor,
  getClassificationLabel,
  kdeToImageData,
  calculateOptimalBandwidth,
  calculateAdaptiveThreshold,
  getAdaptiveResolution,
} from '../utils/spatialAnalysis';
import GISLayerControl, { GISLayers } from './GISLayerControl';
import ProvinceLayer from './ProvinceLayer';
import PoliceStationLayer from './PoliceStationLayer';
import { loadAllLayers } from '../services/gisService';
import { getDemoGISLayers } from '../data/demoGISData';
import AnalysisControls from './AnalysisControls';
import { filterCasesByProvince, locationMatchesProvince } from '../utils/provinceFilter';

// ── Zustand shallow selectors — avoids re-render on unrelated state changes ──
const selectMapData = (s) => ({
  locations: s.locations,
  cases: s.cases,
  drugSeizures: s.drugSeizures,
  personCases: s.personCases,
  persons: s.persons,
});

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
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
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

// ── True KDE Raster Layer — canvas-based density surface via L.ImageOverlay ──
const KDEDensityLayer = ({ kdeResult, opacity = 0.65 }) => {
  const map = useMap();
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!map || !kdeResult || !kdeResult.grid) return;

    // Remove previous overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }

    // Render KDE grid to a <canvas> via kdeToImageData
    const imgResult = kdeToImageData(kdeResult, 'fire', opacity);
    if (!imgResult) return;

    const { imageData, width, height, bounds } = imgResult;

    // Create off-screen canvas
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);
    imgData.data.set(imageData);
    ctx.putImageData(imgData, 0, 0);

    // Create Leaflet ImageOverlay from canvas data URL
    const dataUrl = canvas.toDataURL('image/png');
    const leafletBounds = L.latLngBounds(
      [bounds.minLat, bounds.minLng],
      [bounds.maxLat, bounds.maxLng]
    );

    overlayRef.current = L.imageOverlay(dataUrl, leafletBounds, {
      opacity: 1, // Alpha already baked into the pixel buffer
      interactive: false,
      className: 'kde-raster-overlay',
    }).addTo(map);

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [map, kdeResult, opacity]);

  return null;
};

// Gi* Hotspot Markers Layer
const HotspotLayer = ({ giResults, onMarkerClick }) => {
  
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
              <div className={"min-w-[220px]"}>
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
                    <span style={{ color: 'var(--text-secondary)' }}>Crime Count:</span>
                    <span className="font-mono font-medium">{point.value || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Gi* Z-Score:</span>
                    <span className={`font-mono font-medium ${
                      point.isHotspot ? 'text-red-400' : 
                      point.isColdspot ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {point.zScore.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>P-Value:</span>
                    <span className="font-mono">
                      {point.pValue < 0.001 ? '<0.001' : point.pValue.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
                    <span className={`font-medium ${
                      point.confidenceLevel >= 99 ? 'text-green-400' :
                      point.confidenceLevel >= 95 ? 'text-yellow-400' :
                      point.confidenceLevel >= 90 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {point.confidenceLevel > 0 ? `${point.confidenceLevel}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Neighbors:</span>
                    <span>{point.neighborsCount}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
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

// ── Zoom observer — feeds current zoom level back to parent ──
const ZoomObserver = ({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const handler = () => onZoomChange(map.getZoom());
    handler(); // initial
    map.on('zoomend', handler);
    return () => map.off('zoomend', handler);
  }, [map, onZoomChange]);

  return null;
};

// ── Default analysis parameters ──
const DEFAULT_PARAMS = {
  kdeBandwidth:          10,
  kdeBandwidthAuto:      true,
  kdeKernel:             'quartic',
  kdeResolution:         60,
  kdeResolutionAuto:     true,
  giDistanceThreshold:   5,
  giDistanceThresholdAuto: true,
  giWeightType:          'binary',
};

const CrimeMap = ({ flyToLocation, showHeatmap = true, onMarkerClick }) => {
  // ── Select only the raw arrays we need — stable references unless data changes ──
  const { locations, cases, drugSeizures, personCases, persons } = useDataStore(useShallow(selectMapData));
  const selectedProvince = useDataStore(s => s.selectedProvince);
  const setSelectedProvince = useDataStore(s => s.setSelectedProvince);
  
  // Visualization mode state
  const [vizMode, setVizMode] = useState('heatmap'); // 'heatmap' | 'kde' | 'hotspot' | 'all'
  const [mapZoom, setMapZoom] = useState(10);
  
  // ── Analysis parameters — user-controllable via AnalysisControls ──
  const [analysisParams, setAnalysisParams] = useState(DEFAULT_PARAMS);
  
  // GIS layers state
  const [gisLayers, setGisLayers] = useState(null);
  const [, setGisLayersLoading] = useState(false);
  // Base layer — mutually exclusive: 'provinces' | 'policeStations' | null
  const [activeBaseLayer, setActiveBaseLayer] = useState('provinces');
  const [visibleGISLayers, setVisibleGISLayers] = useState({
    schools: false,
    tambonCentroids: false,
    policeStations: false,
    roads: false,
    provinces: true,
    amphoe: false,
    forests: false
  });
  
  // Center on Chiang Rai
  const defaultCenter = [20.15, 99.95];
  const defaultZoom = 10;

  // Load GIS layers on mount
  useEffect(() => {
    const loadGISLayers = async () => {
      try {
        setGisLayersLoading(true);
        try {
          const layers = await loadAllLayers();
          // Only use the fetched layers if they actually contain features —
          // otherwise (missing files, or an SPA host returning index.html for
          // /geojson) fall back to the bundled demo data.
          const featureCount = ['points', 'lines', 'polygons'].reduce((sum, kind) =>
            sum + Object.values(layers?.[kind] || {}).reduce((s, fc) => s + (fc?.features?.length || 0), 0), 0);
          if (featureCount > 0) {
            setGisLayers(layers);
            return;
          }
        } catch {
          console.log('GeoJSON files not available, using demo data');
        }
        const demoLayers = getDemoGISLayers();
        setGisLayers(demoLayers);
      } catch (error) {
        console.error('Failed to load GIS layers:', error);
        const demoLayers = getDemoGISLayers();
        setGisLayers(demoLayers);
      } finally {
        setGisLayersLoading(false);
      }
    };
    loadGISLayers();
  }, []);

  const handleGISLayerToggle = (layerName, isVisible) => {
    // Enforce mutual exclusion for base layers
    if (layerName === 'provinces' || layerName === 'policeStations') {
      const other = layerName === 'provinces' ? 'policeStations' : 'provinces';
      if (isVisible) {
        setActiveBaseLayer(layerName);
        setVisibleGISLayers(prev => ({ ...prev, [layerName]: true, [other]: false }));
      } else {
        setActiveBaseLayer(null);
        setVisibleGISLayers(prev => ({ ...prev, [layerName]: false }));
      }
    } else {
      setVisibleGISLayers(prev => ({ ...prev, [layerName]: isVisible }));
    }
  };

  // Handle base layer toggle from the floating segmented control
  const handleBaseLayerChange = useCallback((layer) => {
    setActiveBaseLayer(layer);
    setVisibleGISLayers(prev => ({
      ...prev,
      provinces: layer === 'provinces',
      policeStations: layer === 'policeStations',
    }));
  }, []);

  const handleZoomChange = useCallback((z) => setMapZoom(z), []);

  // ── Compute derived data with stable deps ──
  // Province filter scopes the whole map experience: filtering cases here
  // cascades to markers, heatmap, KDE and the Gi*/Moran's I/ANN analysis,
  // since they all derive from caseLocations.
  const caseLocations = useMemo(() => {
    const scopedCases = filterCasesByProvince(cases, locations, selectedProvince);
    return scopedCases.map(c => {
      const location = locations.find(l => l.LocationID === c.LocationID);
      const seizures = drugSeizures.filter(s => s.CaseID === c.CaseID);
      const involvedPersonIds = personCases.filter(pc => pc.CaseID === c.CaseID);
      const involvedPersons = involvedPersonIds.map(pc => ({
        ...persons.find(p => p.PersonID === pc.PersonID),
        Role: pc.Role
      }));
      return { ...location, case: c, seizures, involvedPersons };
    });
  }, [cases, locations, drugSeizures, personCases, persons, selectedProvince]);

  // Prepare aggregated analysis points
  const analysisPoints = useMemo(() => {
    const locationMap = new Map();
    
    caseLocations.forEach(loc => {
      if (!loc.Latitude || !loc.Longitude) return; // skip cases without valid location
      const key = `${loc.Latitude.toFixed(4)},${loc.Longitude.toFixed(4)}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          id: loc.LocationID, lat: loc.Latitude, lng: loc.Longitude,
          caseCount: 0, seizureCount: 0, totalSeizureWeight: 0,
          cases: [], seizures: [], ...loc,
        });
      }
      const agg = locationMap.get(key);
      agg.caseCount++;
      if (loc.seizures) {
        agg.seizureCount += loc.seizures.length;
        agg.seizures.push(...loc.seizures);
        loc.seizures.forEach(s => {
          agg.totalSeizureWeight += (parseFloat(s.Quantity) || 0);
        });
      }
      if (loc.case) agg.cases.push(loc.case);
    });
    
    return Array.from(locationMap.values()).map(loc => ({
      ...loc,
      value: loc.caseCount + loc.seizureCount,
      intensity: Math.min(1.0, (loc.caseCount + loc.seizureCount) / 5),
    }));
  }, [caseLocations]);

  // ── Auto-calculated reference values (shown on sliders when "Auto" is on) ──
  const autoValues = useMemo(() => {
    if (analysisPoints.length < 2) return { bandwidth: 5, distanceThreshold: 5, resolution: 60 };
    return {
      bandwidth:         calculateOptimalBandwidth(analysisPoints),
      distanceThreshold: calculateAdaptiveThreshold(analysisPoints),
      resolution:        getAdaptiveResolution(mapZoom),
    };
  }, [analysisPoints, mapZoom]);

  // ── Resolve effective parameters (auto vs manual) ──
  const effectiveParams = useMemo(() => ({
    kdeBandwidth:        analysisParams.kdeBandwidthAuto         ? null : analysisParams.kdeBandwidth,
    kdeKernel:           analysisParams.kdeKernel,
    kdeResolution:       analysisParams.kdeResolutionAuto        ? null : analysisParams.kdeResolution,
    giDistanceThreshold: analysisParams.giDistanceThresholdAuto  ? null : analysisParams.giDistanceThreshold,
    giWeightType:        analysisParams.giWeightType,
    zoom:                analysisParams.kdeResolutionAuto        ? mapZoom : null,
  }), [analysisParams, mapZoom]);

  // ── Spatial analysis (KDE + Gi*) — recomputes on param changes ──
  const spatialAnalysis = useMemo(() => {
    if (analysisPoints.length < 3) return null;
    return performSpatialAnalysis(analysisPoints, effectiveParams);
  }, [analysisPoints, effectiveParams]);

  // Heatmap data (for leaflet.heat — purely visual)
  const heatmapPoints = useMemo(() => {
    return analysisPoints.map(p => ({
      lat: p.lat, lng: p.lng,
      intensity: Math.min(1.0, (p.intensity || 0.5) * 1.5),
    }));
  }, [analysisPoints]);

  // All locations for markers
  const allLocations = useMemo(() => {
    const locMap = new Map();
    caseLocations.forEach(loc => {
      if (loc && loc.LocationID && !locMap.has(loc.LocationID)) {
        locMap.set(loc.LocationID, { ...loc, cases: [loc.case], persons: loc.involvedPersons });
      } else if (locMap.has(loc.LocationID)) {
        locMap.get(loc.LocationID).cases.push(loc.case);
      }
    });
    // Also show caseless locations, but respect the province filter.
    locations
      .filter(loc => locationMatchesProvince(loc, selectedProvince))
      .forEach(loc => {
        if (!locMap.has(loc.LocationID)) {
          locMap.set(loc.LocationID, { ...loc, cases: [], persons: [] });
        }
      });
    return Array.from(locMap.values());
  }, [caseLocations, locations, selectedProvince]);

  // Theme
  const { theme } = useThemeStore();
  const tileConfig = theme === 'dark' ? MAP_TILES.dark : MAP_TILES.light;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        key={theme}
      >
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />

        {/* GIS Layers - Point, Line, Polygon (non-province) */}
        <GISLayers gisLayers={gisLayers} visibleLayers={visibleGISLayers} />

        {/* Interactive Province Boundaries — 77 Thai provinces */}
        <ProvinceLayer
          data={gisLayers?.polygons?.provinces}
          visible={visibleGISLayers.provinces}
          selectedProvince={selectedProvince}
          onProvinceSelect={setSelectedProvince}
        />

        {/* Police Stations + Voronoi Jurisdictions */}
        <PoliceStationLayer
          stationData={gisLayers?.points?.policeStations}
          jurisdictionData={gisLayers?.polygons?.policeJurisdictions}
          visible={visibleGISLayers.policeStations}
        />

        {/* Zoom observer — feeds zoom level for adaptive resolution */}
        <ZoomObserver onZoomChange={handleZoomChange} />

        {/* Visualization Layers based on mode */}
        {(vizMode === 'heatmap' || vizMode === 'all') && showHeatmap && (
          <HeatmapLayer points={heatmapPoints} />
        )}

        {(vizMode === 'kde' || vizMode === 'all') && spatialAnalysis?.kde && (
          <KDEDensityLayer kdeResult={spatialAnalysis.kde} opacity={0.65} />
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

                <p className="text-xs mb-3 flex items-start gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {location.AddressDetail || location.Address}
                </p>

                {location.cases && location.cases.length > 0 && (
                  <div className="pt-2 mt-2">
                    <p className="text-xs font-medium mb-2">Related Cases:</p>
                    {location.cases.map((c, idx) => (
                      <div key={idx} className="rounded p-2 mb-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono">{c.CaseNumber}</span>
                          <span className={`badge ${
                            c.Status === 'Under Investigation' ? 'badge-pending' :
                            c.Status === 'Adjudicated' ? 'badge-arrested' : 'badge-active'
                          }`}>
                            {c.Status}
                          </span>
                        </div>
                        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{c.CaseType}</p>
                      </div>
                    ))}
                  </div>
                )}

                {location.persons && location.persons.length > 0 && (
                  <div className="pt-2 mt-2">
                    <p className="text-xs font-medium mb-2">Involved Persons:</p>
                    {location.persons.slice(0, 3).map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs mb-1">
                        <User className="w-3 h-3 " style={{ color: 'var(--text-secondary)' }} />
                        <span>{p.FirstName} {p.LastName}</span>
                        <span style={{ color: 'var(--text-tertiary)' }}>({p.Alias})</span>
                      </div>
                    ))}
                    {location.persons.length > 3 && (
                      <p className="text-xs " style={{ color: 'var(--text-tertiary)' }}>+{location.persons.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* GIS Layer Control Panel */}
      <GISLayerControl gisLayers={gisLayers} onLayerToggle={handleGISLayerToggle} visibleLayers={visibleGISLayers} />

      {/* ── Base Layer Segmented Toggle ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[800] rounded-2xl glass-floating p-1 flex items-center gap-1">
        {[
          { id: 'provinces', label: 'Provinces', icon: '🗺️' },
          { id: 'policeStations', label: 'Police Stations', icon: '🚔' },
        ].map((opt) => {
          const isActive = activeBaseLayer === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleBaseLayerChange(isActive ? null : opt.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300"
              style={
                isActive
                  ? {
                      background: 'var(--accent-cyan)',
                      color: '#fff',
                      boxShadow: '0 0 14px var(--glow-cyan)',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                    }
              }
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--glass-regular)';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Visualization Mode Selector */}
      <div className="absolute top-20 right-4 z-[800] rounded-2xl p-2.5 glass-floating">
        <div className="flex items-center gap-1 mb-2">
          <Layers className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            Analysis Mode
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {[
            { id: 'heatmap', label: 'Heatmap', icon: '🔥', desc: 'Client-side WebGL' },
            { id: 'kde', label: 'KDE Surface', icon: '📊', desc: 'True kernel density' },
            { id: 'hotspot', label: 'Gi* Hotspot', icon: '📍', desc: 'Statistical clusters' },
            { id: 'all', label: 'All Layers', icon: '🗺️', desc: 'Combined view' },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setVizMode(mode.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${vizMode === mode.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              style={vizMode === mode.id
                ? { background: 'var(--accent-cyan)', boxShadow: '0 0 12px var(--glow-cyan)' }
                : { background: 'var(--glass-thin)' }}
              title={mode.desc}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Analysis Controls — parameter sliders + stats + methodology ── */}
      {vizMode !== 'heatmap' && (
        <AnalysisControls
          params={analysisParams}
          onParamsChange={setAnalysisParams}
          autoValues={autoValues}
          giSummary={spatialAnalysis?.giStar?.summary}
          kdeResult={spatialAnalysis?.kde}
          moransI={spatialAnalysis?.moransI}
          ann={spatialAnalysis?.ann}
          vizMode={vizMode}
        />
      )}

      {/* Heatmap info — when in heatmap-only mode, show minimal controls */}
      {vizMode === 'heatmap' && (
        <AnalysisControls
          params={analysisParams}
          onParamsChange={setAnalysisParams}
          autoValues={autoValues}
          giSummary={null}
          kdeResult={null}
          vizMode={vizMode}
        />
      )}

      {/* Selected Province Badge */}
      {selectedProvince && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] rounded-2xl px-4 py-2.5 glass-floating flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--glow-cyan)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Province Filter:
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent-cyan)' }}>
              {selectedProvince.th}{selectedProvince.en ? ` (${selectedProvince.en})` : ''}
            </span>
          </div>
          <button
            onClick={() => setSelectedProvince(null)}
            className="text-xs px-2 py-1 rounded-lg transition-all hover:scale-105"
            style={{ background: 'var(--glass-regular)', color: 'var(--text-secondary)' }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-14 right-4 z-[800] rounded-2xl p-3.5 glass-floating">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Legend</p>
        
        {vizMode !== 'hotspot' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300"></div>
              <span style={{ color: 'var(--text-secondary)' }}>Crime Scene</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300"></div>
              <span style={{ color: 'var(--text-secondary)' }}>Residence</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-yellow-300"></div>
              <span style={{ color: 'var(--text-secondary)' }}>Drop-off Point</span>
            </div>
          </div>
        )}

        {(vizMode === 'heatmap' || vizMode === 'kde' || vizMode === 'all') && (
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {vizMode === 'kde' ? 'KDE Density' : 'Crime Density'}
            </p>
            <div className="h-2 mt-1 rounded bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500"></div>
            <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

        {(vizMode === 'hotspot' || vizMode === 'all') && (
          <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Gi* Statistical Significance
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-red-800"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Hotspot 99% CI (Z≥2.58)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Hotspot 95% CI (Z≥1.96)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Hotspot 90% CI (Z≥1.65)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Not Significant</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Coldspot 90% CI (Z≤-1.65)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Coldspot 95% CI (Z≤-1.96)</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Coldspot 99% CI (Z≤-2.58)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrimeMap;
