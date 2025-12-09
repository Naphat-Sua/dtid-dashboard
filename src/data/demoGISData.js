/**
 * Demo GIS Data Loader
 * This file provides sample GeoJSON data for testing when shapefile loading fails
 */

export const demoPointData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [99.8325, 19.9071] // Chiang Rai University
      },
      properties: {
        name: 'Chiang Rai University',
        type: 'University'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [99.8372, 19.9103]
      },
      properties: {
        name: 'Mae Fah Luang University',
        type: 'University'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [99.8296, 19.9156]
      },
      properties: {
        name: 'Chiang Rai Technical College',
        type: 'College'
      }
    }
  ]
};

export const demoLineData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.81, 19.90],
          [99.82, 19.91],
          [99.83, 19.92],
          [99.84, 19.93]
        ]
      },
      properties: {
        name: 'Highway 1',
        type: 'Primary Road'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.82, 19.88],
          [99.83, 19.89],
          [99.84, 19.90],
          [99.85, 19.91]
        ]
      },
      properties: {
        name: 'Highway 1020',
        type: 'Secondary Road'
      }
    }
  ]
};

export const demoPolygonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.80, 19.88],
          [99.86, 19.88],
          [99.86, 19.94],
          [99.80, 19.94],
          [99.80, 19.88]
        ]]
      },
      properties: {
        name: 'Mueang Chiang Rai',
        type: 'District',
        province: 'Chiang Rai'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.70, 19.80],
          [99.75, 19.80],
          [99.75, 19.85],
          [99.70, 19.85],
          [99.70, 19.80]
        ]]
      },
      properties: {
        name: 'Mae Chan',
        type: 'District',
        province: 'Chiang Rai'
      }
    }
  ]
};

export const demoBoundaryData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.50, 19.60],
          [100.50, 19.60],
          [100.50, 20.60],
          [99.50, 20.60],
          [99.50, 19.60]
        ]]
      },
      properties: {
        name: 'Chiang Rai Province',
        type: 'Province',
        ADM1_EN: 'Chiang Rai',
        PROV_NAM_E: 'Chiang Rai'
      }
    }
  ]
};

/**
 * Get demo GIS layers (fallback when shapefile loading fails)
 */
export function getDemoGISLayers() {
  return {
    points: {
      schools: demoPointData,
      tambonCentroids: demoPointData
    },
    lines: {
      roads: demoLineData
    },
    polygons: {
      provinces: demoBoundaryData,
      forests: demoPolygonData,
      buildings: demoPolygonData
    }
  };
}
