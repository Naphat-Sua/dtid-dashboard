import React, { useState, useMemo } from 'react';
import { GeoJSON, Marker, Popup, Polyline, Polygon, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, EyeOff, MapPin, Route, Square, AlertCircle } from 'lucide-react';

// Performance limits
const MAX_POINTS = 500;
const MAX_LINES = 1000;
const MAX_POLYGONS = 200;

/**
 * GIS Layer Control Component
 * Manages point, line, and polygon layers from shapefiles
 */
const GISLayerControl = ({ onLayerToggle, visibleLayers: externalVisibleLayers }) => {

  // Internal defaults; the parent's externalVisibleLayers wins for known keys.
  const [internalLayers, setInternalLayers] = useState({
    // Point layers
    schools: false,
    tambonCentroids: false,
    policeStations: false,
    markets: false,

    // Line layers
    roads: false,

    // Polygon layers
    provinces: true,
    amphoe: false,
    forests: false,
    tambon: true
  });

  // Derived visibility (no prop→state sync effect): parent state overrides
  // internal for any key it provides.
  const visibleLayers = useMemo(() => {
    if (!externalVisibleLayers) return internalLayers;
    const merged = { ...internalLayers };
    for (const key of Object.keys(externalVisibleLayers)) {
      if (key in merged) merged[key] = externalVisibleLayers[key];
    }
    return merged;
  }, [internalLayers, externalVisibleLayers]);

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLayer = (layerName) => {
    const next = !visibleLayers[layerName];
    setInternalLayers(prev => ({ ...prev, [layerName]: next }));
    if (onLayerToggle) {
      onLayerToggle(layerName, next);
    }
  };

  // Layer definitions with styling
  const layerDefinitions = {
    // Point Layers
    schools: {
      name: 'Schools & Colleges',
      type: 'point',
      icon: MapPin,
      color: '#3b82f6',
      description: 'Educational institutions'
    },
    tambonCentroids: {
      name: 'Tambon Centers',
      type: 'point',
      icon: MapPin,
      color: '#8b5cf6',
      description: 'Sub-district center points'
    },
    policeStations: {
      name: 'Police Stations',
      type: 'point',
      icon: AlertCircle,
      color: '#3b82f6',
      description: 'Thai police stations + jurisdiction'
    },
    markets: {
      name: 'Markets & Communities',
      type: 'point',
      icon: MapPin,
      color: '#22c55e',
      description: 'Markets and community hubs'
    },
    
    // Line Layers
    roads: {
      name: 'Road Network',
      type: 'line',
      icon: Route,
      color: '#f59e0b',
      description: 'Road infrastructure'
    },
    
    // Polygon Layers
    provinces: {
      name: 'Province Boundaries',
      type: 'polygon',
      icon: Square,
      color: '#10b981',
      description: 'Provincial administrative boundaries'
    },
    amphoe: {
      name: 'Amphoe Boundaries',
      type: 'polygon',
      icon: Square,
      color: '#0ea5e9',
      description: 'District administrative boundaries'
    },
    forests: {
      name: 'Reserved Forests',
      type: 'polygon',
      icon: Square,
      color: '#059669',
      description: 'National reserved forest areas'
    },
    tambon: {
      name: 'Tambon Boundaries',
      type: 'polygon',
      icon: Square,
      color: '#cbd5e1',
      description: 'Sam Phran subdistrict boundaries (dashed)'
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[800] rounded-2xl glass-floating"
      style={{ maxWidth: '280px' }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer rounded-t-2xl transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            GIS Layers
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Layer List */}
      {isExpanded && (
        <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Point Layers Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <span className="text-[10px] font-bold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                Point Layers
              </span>
            </div>
            <div className="space-y-1 ml-6">
              {Object.entries(layerDefinitions)
                .filter(([_, def]) => def.type === 'point')
                .map(([key, layer]) => (
                  <LayerToggleButton
                    key={key}
                    layerKey={key}
                    layer={layer}
                    isVisible={visibleLayers[key]}
                    onToggle={toggleLayer}

                  />
                ))}
            </div>
          </div>

          {/* Line Layers Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className="w-4 h-4" style={{ color: 'var(--accent-orange)' }} />
              <span className="text-[10px] font-bold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                Line Layers
              </span>
            </div>
            <div className="space-y-1 ml-6">
              {Object.entries(layerDefinitions)
                .filter(([_, def]) => def.type === 'line')
                .map(([key, layer]) => (
                  <LayerToggleButton
                    key={key}
                    layerKey={key}
                    layer={layer}
                    isVisible={visibleLayers[key]}
                    onToggle={toggleLayer}

                  />
                ))}
            </div>
          </div>

          {/* Polygon Layers Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Square className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span className="text-[10px] font-bold" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-quaternary)' }}>
                Polygon Layers
              </span>
            </div>
            <div className="space-y-1 ml-6">
              {Object.entries(layerDefinitions)
                .filter(([_, def]) => def.type === 'polygon')
                .map(([key, layer]) => (
                  <LayerToggleButton
                    key={key}
                    layerKey={key}
                    layer={layer}
                    isVisible={visibleLayers[key]}
                    onToggle={toggleLayer}

                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual layer toggle button
 */
const LayerToggleButton = ({ layerKey, layer, isVisible, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(layerKey)}
      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all duration-300"
      style={isVisible
        ? { background: 'var(--glass-regular)', color: 'var(--text-primary)' }
        : { color: 'var(--text-tertiary)' }}
      onMouseOver={e => { if(!isVisible) e.currentTarget.style.background = 'var(--glass-thin)'; }}
      onMouseOut={e => { if(!isVisible) e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: layer.color }}
        />
        <span>{layer.name}</span>
      </div>
      {isVisible ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
    </button>
  );
};

/**
 * GIS Layers Renderer - OPTIMIZED for performance
 * Uses Canvas rendering and feature limits for large datasets
 */
export const GISLayers = ({ gisLayers, visibleLayers }) => {
  // Stable canvas renderer (memoized so it's readable during render without a ref).
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  if (!gisLayers) return null;

  // Polygon style function
  const getPolygonStyle = (layerType) => {
    const styles = {
      provinces: {
        fillColor: '#10b981',
        fillOpacity: 0.1,
        color: '#059669',
        weight: 2,
        opacity: 0.8,
        renderer: canvasRenderer
      },
      amphoe: {
        fillColor: '#0ea5e9',
        fillOpacity: 0.1,
        color: '#0284c7',
        weight: 1.5,
        opacity: 0.7,
        renderer: canvasRenderer
      },
      forests: {
        fillColor: '#059669',
        fillOpacity: 0.3,
        color: '#047857',
        weight: 1,
        opacity: 0.6,
        renderer: canvasRenderer
      },
      tambon: {
        fillColor: '#94a3b8',
        fillOpacity: 0.03,
        color: '#cbd5e1',
        weight: 1.5,
        opacity: 0.9,
        dashArray: '6,6',
        renderer: canvasRenderer
      }
    };
    return styles[layerType] || styles.provinces;
  };

  // Line style function
  const getLineStyle = (layerType) => {
    const styles = {
      roads: {
        color: '#f59e0b',
        weight: 2,
        opacity: 0.7,
        renderer: canvasRenderer
      }
    };
    return styles[layerType] || styles.roads;
  };

  // Limit features for performance
  const limitFeatures = (featureCollection, maxFeatures) => {
    if (!featureCollection?.features) return featureCollection;
    if (featureCollection.features.length <= maxFeatures) return featureCollection;
    
    return {
      ...featureCollection,
      features: featureCollection.features.slice(0, maxFeatures)
    };
  };

  // Render point features using CircleMarker (faster than Marker)
  const renderPointLayer = (features, layerKey, color) => {
    if (!features || !visibleLayers?.[layerKey]) return null;

    // Limit points for performance
    const limitedFeatures = features.slice(0, MAX_POINTS);

    return limitedFeatures.map((feature, idx) => {
      if (feature.geometry?.type !== 'Point') return null;
      
      const [lng, lat] = feature.geometry.coordinates;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
      
      const properties = feature.properties || {};

      return (
        <CircleMarker
          key={`${layerKey}-${idx}`}
          center={[lat, lng]}
          radius={4}
          pathOptions={{
            fillColor: color,
            fillOpacity: 0.8,
            color: 'white',
            weight: 1,
            opacity: 1
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-semibold mb-2 text-sm">
                {properties.NAME || properties.TAMBON_T || properties.name || 'Point'}
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(properties).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-medium">{String(value).slice(0, 30)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      );
    });
  };

  // Render polygon layer with GeoJSON (limited features)
  const renderPolygonLayer = (featureCollection, layerKey) => {
    if (!featureCollection || !visibleLayers?.[layerKey]) return null;

    const limitedData = limitFeatures(featureCollection, MAX_POLYGONS);

    return (
      <GeoJSON
        key={`${layerKey}-${visibleLayers[layerKey]}`}
        data={limitedData}
        style={getPolygonStyle(layerKey)}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties || {};
          const name = properties.TAMBON_T || properties.ADM1_EN || properties.ADM2_EN || properties.PROV_NAM_E || 
                       properties.NAME || properties.name || 'Feature';
          layer.bindPopup(`<div style="font-weight:600;">${name}</div>`);
        }}
      />
    );
  };

  // Render line layer with GeoJSON (limited features)
  const renderLineLayer = (featureCollection, layerKey) => {
    if (!featureCollection || !visibleLayers?.[layerKey]) return null;

    const limitedData = limitFeatures(featureCollection, MAX_LINES);

    return (
      <GeoJSON
        key={`${layerKey}-${visibleLayers[layerKey]}`}
        data={limitedData}
        style={getLineStyle(layerKey)}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties || {};
          const name = properties.NAME || properties.name || 'Road';
          layer.bindPopup(`<div style="font-weight:600;">${name}</div>`);
        }}
      />
    );
  };

  return (
    <>
      {/* Point Layers - using CircleMarker for performance */}
      {gisLayers.points?.schools && 
        renderPointLayer(gisLayers.points.schools.features, 'schools', '#3b82f6')}
      {gisLayers.points?.tambonCentroids && 
        renderPointLayer(gisLayers.points.tambonCentroids.features, 'tambonCentroids', '#8b5cf6')}
      {gisLayers.points?.markets &&
        renderPointLayer(gisLayers.points.markets.features, 'markets', '#22c55e')}

      {/* Line Layers */}
      {gisLayers.lines?.roads && 
        renderLineLayer(gisLayers.lines.roads, 'roads')}

      {/* Polygon Layers — provinces handled by ProvinceLayer in CrimeMap */}
      {gisLayers.polygons?.tambon &&
        renderPolygonLayer(gisLayers.polygons.tambon, 'tambon')}
      {gisLayers.polygons?.amphoe && 
        renderPolygonLayer(gisLayers.polygons.amphoe, 'amphoe')}
      {gisLayers.polygons?.forests && 
        renderPolygonLayer(gisLayers.polygons.forests, 'forests')}
    </>
  );
};

export default GISLayerControl;
