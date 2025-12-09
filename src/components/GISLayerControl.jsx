import React, { useState, useEffect } from 'react';
import { GeoJSON, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, EyeOff, MapPin, Route, Square } from 'lucide-react';
import { useThemeStore } from '../store/useStore';

/**
 * GIS Layer Control Component
 * Manages point, line, and polygon layers from shapefiles
 */
const GISLayerControl = ({ gisLayers, onLayerToggle }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  
  // Layer visibility state
  const [visibleLayers, setVisibleLayers] = useState({
    // Point layers
    schools: false,
    tambonCentroids: false,
    
    // Line layers
    roads: false,
    
    // Polygon layers
    provinces: true,
    amphoe: false,
    forests: false
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleLayer = (layerName) => {
    const newState = { ...visibleLayers, [layerName]: !visibleLayers[layerName] };
    setVisibleLayers(newState);
    if (onLayerToggle) {
      onLayerToggle(layerName, newState[layerName]);
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
    }
  };

  return (
    <div className={`absolute top-4 right-4 z-[1000] rounded-lg shadow-lg backdrop-blur-sm
      ${isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}
      style={{ maxWidth: '280px' }}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-3 cursor-pointer
          ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} rounded-t-lg`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            GIS Layers
          </span>
        </div>
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Layer List */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-700">
          {/* Point Layers Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
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
                    isDark={isDark}
                  />
                ))}
            </div>
          </div>

          {/* Line Layers Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Route className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
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
                    isDark={isDark}
                  />
                ))}
            </div>
          </div>

          {/* Polygon Layers Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Square className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
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
                    isDark={isDark}
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
const LayerToggleButton = ({ layerKey, layer, isVisible, onToggle, isDark }) => {
  return (
    <button
      onClick={() => onToggle(layerKey)}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors
        ${isVisible
          ? isDark
            ? 'bg-slate-700 text-white'
            : 'bg-gray-200 text-gray-900'
          : isDark
            ? 'text-slate-400 hover:bg-slate-800'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
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
 * GIS Layers Renderer
 * Renders point, line, and polygon layers on the map
 */
export const GISLayers = ({ gisLayers, visibleLayers }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  if (!gisLayers) return null;

  // Point layer styles
  const createPointIcon = (color) => {
    return L.divIcon({
      className: 'custom-point-icon',
      html: `
        <div style="
          width: 8px;
          height: 8px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [8, 8],
      iconAnchor: [4, 4],
      popupAnchor: [0, -4],
    });
  };

  // Polygon style function
  const getPolygonStyle = (layerType) => {
    const styles = {
      provinces: {
        fillColor: '#10b981',
        fillOpacity: 0.1,
        color: '#059669',
        weight: 2,
        opacity: 0.8
      },
      amphoe: {
        fillColor: '#0ea5e9',
        fillOpacity: 0.1,
        color: '#0284c7',
        weight: 1.5,
        opacity: 0.7
      },
      forests: {
        fillColor: '#059669',
        fillOpacity: 0.3,
        color: '#047857',
        weight: 1,
        opacity: 0.6
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
        opacity: 0.7
      }
    };
    return styles[layerType] || styles.roads;
  };

  // Render point features
  const renderPointLayer = (features, layerKey, color) => {
    if (!features || !visibleLayers?.[layerKey]) return null;

    return features.map((feature, idx) => {
      if (feature.geometry.type !== 'Point') return null;
      
      const [lng, lat] = feature.geometry.coordinates;
      const properties = feature.properties || {};

      return (
        <Marker
          key={`${layerKey}-${idx}`}
          position={[lat, lng]}
          icon={createPointIcon(color)}
        >
          <Popup>
            <div className={`min-w-[200px] ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              <div className="font-semibold mb-2 text-sm">
                {properties.NAME || properties.TAMBON_T || 'Point Feature'}
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(properties).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-slate-400">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  // Render polygon layer with GeoJSON
  const renderPolygonLayer = (featureCollection, layerKey) => {
    if (!featureCollection || !visibleLayers?.[layerKey]) return null;

    return (
      <GeoJSON
        key={`${layerKey}-${Date.now()}`}
        data={featureCollection}
        style={getPolygonStyle(layerKey)}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties || {};
          layer.bindPopup(`
            <div style="min-width: 200px;">
              <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                ${properties.ADM1_EN || properties.PROV_NAM_E || properties.name || 'Polygon Feature'}
              </div>
              <div style="font-size: 12px;">
                ${Object.entries(properties)
                  .slice(0, 5)
                  .map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: #94a3b8;">${key}:</span>
                      <span style="font-weight: 500;">${String(value)}</span>
                    </div>
                  `)
                  .join('')}
              </div>
            </div>
          `);
        }}
      />
    );
  };

  // Render line layer with GeoJSON
  const renderLineLayer = (featureCollection, layerKey) => {
    if (!featureCollection || !visibleLayers?.[layerKey]) return null;

    return (
      <GeoJSON
        key={`${layerKey}-${Date.now()}`}
        data={featureCollection}
        style={getLineStyle(layerKey)}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties || {};
          layer.bindPopup(`
            <div style="min-width: 200px;">
              <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
                ${properties.NAME || properties.name || 'Line Feature'}
              </div>
              <div style="font-size: 12px;">
                ${Object.entries(properties)
                  .slice(0, 5)
                  .map(([key, value]) => `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: #94a3b8;">${key}:</span>
                      <span style="font-weight: 500;">${String(value)}</span>
                    </div>
                  `)
                  .join('')}
              </div>
            </div>
          `);
        }}
      />
    );
  };

  return (
    <>
      {/* Point Layers */}
      {gisLayers.points?.schools && 
        renderPointLayer(gisLayers.points.schools.features, 'schools', '#3b82f6')}
      {gisLayers.points?.tambonCentroids && 
        renderPointLayer(gisLayers.points.tambonCentroids.features, 'tambonCentroids', '#8b5cf6')}

      {/* Line Layers */}
      {gisLayers.lines?.roads && 
        renderLineLayer(gisLayers.lines.roads, 'roads')}

      {/* Polygon Layers */}
      {gisLayers.polygons?.provinces && 
        renderPolygonLayer(gisLayers.polygons.provinces, 'provinces')}
      {gisLayers.polygons?.amphoe && 
        renderPolygonLayer(gisLayers.polygons.amphoe, 'amphoe')}
      {gisLayers.polygons?.forests && 
        renderPolygonLayer(gisLayers.polygons.forests, 'forests')}
    </>
  );
};

export default GISLayerControl;
