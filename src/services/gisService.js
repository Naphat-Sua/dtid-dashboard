/**
 * GIS Service - Loads GeoJSON layers for map visualization
 */

/**
 * Load a GeoJSON file from the public directory
 * @param {string} path - Path to GeoJSON file (relative to public folder)
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 */
export async function loadGeoJSON(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading GeoJSON from ${path}:`, error);
    throw error;
  }
}

/**
 * Load point data (schools, tambon centroids)
 * @returns {Promise<Object>} Object containing point layers
 */
export async function loadPointLayers() {
  const pointLayers = {};
  
  try {
    pointLayers.schools = await loadGeoJSON('/geojson/point/schools.json');
    console.log('Loaded schools:', pointLayers.schools?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load schools:', err);
  }
  
  try {
    pointLayers.tambonCentroids = await loadGeoJSON('/geojson/point/tambon-centroids.json');
    console.log('Loaded tambon centroids:', pointLayers.tambonCentroids?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load tambon centroids:', err);
  }
  
  return pointLayers;
}

/**
 * Load line data (roads)
 * @returns {Promise<Object>} Object containing line layers
 */
export async function loadLineLayers() {
  const lineLayers = {};
  
  try {
    lineLayers.roads = await loadGeoJSON('/geojson/line/roads.json');
    console.log('Loaded roads:', lineLayers.roads?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load roads:', err);
  }
  
  return lineLayers;
}

/**
 * Load polygon data (provinces, forests, amphoe)
 * @returns {Promise<Object>} Object containing polygon layers
 */
export async function loadPolygonLayers() {
  const polygonLayers = {};
  
  try {
    polygonLayers.provinces = await loadGeoJSON('/geojson/polygon/provinces.json');
    console.log('Loaded provinces:', polygonLayers.provinces?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load provinces:', err);
  }
  
  try {
    polygonLayers.forests = await loadGeoJSON('/geojson/polygon/forests.json');
    console.log('Loaded forests:', polygonLayers.forests?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load forests:', err);
  }
  
  try {
    polygonLayers.amphoe = await loadGeoJSON('/geojson/polygon/amphoe.json');
    console.log('Loaded amphoe:', polygonLayers.amphoe?.features?.length || 0, 'features');
  } catch (err) {
    console.warn('Could not load amphoe:', err);
  }
  
  return polygonLayers;
}

/**
 * Load all GIS layers
 * @returns {Promise<Object>} Object containing all layers
 */
export async function loadAllLayers() {
  const [pointLayers, lineLayers, polygonLayers] = await Promise.all([
    loadPointLayers(),
    loadLineLayers(),
    loadPolygonLayers()
  ]);
  
  return {
    points: pointLayers,
    lines: lineLayers,
    polygons: polygonLayers
  };
}

/**
 * Get feature geometry type
 * @param {Object} feature - GeoJSON feature
 * @returns {string} Geometry type (Point, LineString, Polygon, etc.)
 */
export function getGeometryType(feature) {
  return feature?.geometry?.type || 'Unknown';
}

/**
 * Calculate bounding box for features
 * @param {Array} features - Array of GeoJSON features
 * @returns {Array} Bounding box [minLng, minLat, maxLng, maxLat]
 */
export function calculateBounds(features) {
  if (!features || features.length === 0) return null;
  
  let minLng = Infinity, minLat = Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;
  
  features.forEach(feature => {
    const coords = feature.geometry.coordinates;
    const type = feature.geometry.type;
    
    const processCoord = (coord) => {
      const [lng, lat] = coord;
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    };
    
    if (type === 'Point') {
      processCoord(coords);
    } else if (type === 'LineString') {
      coords.forEach(processCoord);
    } else if (type === 'Polygon') {
      coords[0].forEach(processCoord);
    } else if (type === 'MultiPolygon') {
      coords.forEach(polygon => {
        polygon[0].forEach(processCoord);
      });
    }
  });
  
  return [minLng, minLat, maxLng, maxLat];
}
