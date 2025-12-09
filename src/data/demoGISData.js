/**
 * Demo GIS Data for Vercel deployment
 * Contains simplified but realistic GeoJSON data for Chiang Rai area
 */

// Schools and educational institutions in Chiang Rai
export const demoPointData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.8325, 19.9071] },
      properties: { NAME: 'Chiang Rai Rajabhat University', type: 'University' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.8931, 20.0465] },
      properties: { NAME: 'Mae Fah Luang University', type: 'University' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.8296, 19.9156] },
      properties: { NAME: 'Chiang Rai Technical College', type: 'College' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.8812, 19.9089] },
      properties: { NAME: 'Damrongratsongkroh School', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.9523, 20.2512] },
      properties: { NAME: 'Mae Sai School', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0875, 20.1623] },
      properties: { NAME: 'Chiang Saen School', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [99.8756, 19.7534] },
      properties: { NAME: 'Wiang Pa Pao School', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2645, 19.9876] },
      properties: { NAME: 'Chiang Khong School', type: 'School' }
    }
  ]
};

// Major roads in Chiang Rai
export const demoLineData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.8312, 19.9102], [99.8756, 19.9534], [99.9234, 20.0123],
          [99.9523, 20.1234], [99.9612, 20.2512]
        ]
      },
      properties: { NAME: 'Highway 1 (Phahonyothin)', type: 'Primary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.8312, 19.9102], [99.9456, 19.9234], [100.0875, 19.9567],
          [100.1523, 19.9789], [100.2645, 19.9876]
        ]
      },
      properties: { NAME: 'Highway 1020', type: 'Secondary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.9612, 20.2512], [100.0234, 20.2123], [100.0875, 20.1623]
        ]
      },
      properties: { NAME: 'Highway 1290 (Mae Sai - Chiang Saen)', type: 'Secondary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [99.8312, 19.9102], [99.8123, 19.8456], [99.8234, 19.7534]
        ]
      },
      properties: { NAME: 'Highway 118', type: 'Secondary' }
    }
  ]
};

// Chiang Rai Province boundary (simplified)
export const demoProvinceData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.3245, 19.3567], [99.5678, 19.2345], [99.8912, 19.3456],
          [100.1234, 19.4567], [100.3456, 19.6789], [100.4567, 19.8912],
          [100.5123, 20.0234], [100.4234, 20.2345], [100.3456, 20.3567],
          [100.1789, 20.4678], [99.9567, 20.5234], [99.7345, 20.4567],
          [99.5678, 20.3456], [99.4123, 20.1234], [99.3456, 19.8912],
          [99.2789, 19.6789], [99.2567, 19.4567], [99.3245, 19.3567]
        ]]
      },
      properties: {
        ADM1_EN: 'Chiang Rai',
        PROV_NAM_E: 'Chiang Rai',
        ADM1_TH: 'เชียงราย'
      }
    }
  ]
};

// Amphoe (Districts) in Chiang Rai
export const demoAmphoeData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.78, 19.85], [99.92, 19.85], [99.92, 19.98], [99.78, 19.98], [99.78, 19.85]
        ]]
      },
      properties: { ADM2_EN: 'Mueang Chiang Rai', ADM2_TH: 'เมืองเชียงราย' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.88, 20.18], [100.02, 20.18], [100.02, 20.32], [99.88, 20.32], [99.88, 20.18]
        ]]
      },
      properties: { ADM2_EN: 'Mae Sai', ADM2_TH: 'แม่สาย' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.02, 20.08], [100.16, 20.08], [100.16, 20.22], [100.02, 20.22], [100.02, 20.08]
        ]]
      },
      properties: { ADM2_EN: 'Chiang Saen', ADM2_TH: 'เชียงแสน' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.18, 19.88], [100.32, 19.88], [100.32, 20.02], [100.18, 20.02], [100.18, 19.88]
        ]]
      },
      properties: { ADM2_EN: 'Chiang Khong', ADM2_TH: 'เชียงของ' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.78, 19.68], [99.92, 19.68], [99.92, 19.82], [99.78, 19.82], [99.78, 19.68]
        ]]
      },
      properties: { ADM2_EN: 'Wiang Pa Pao', ADM2_TH: 'เวียงป่าเป้า' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.92, 19.98], [100.06, 19.98], [100.06, 20.12], [99.92, 20.12], [99.92, 19.98]
        ]]
      },
      properties: { ADM2_EN: 'Mae Chan', ADM2_TH: 'แม่จัน' }
    }
  ]
};

// Forest reserves (simplified)
export const demoForestData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.45, 19.95], [99.62, 19.95], [99.62, 20.15], [99.45, 20.15], [99.45, 19.95]
        ]]
      },
      properties: { NAME: 'Doi Luang National Park', type: 'National Park' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.68, 20.25], [99.85, 20.25], [99.85, 20.42], [99.68, 20.42], [99.68, 20.25]
        ]]
      },
      properties: { NAME: 'Doi Tung Wildlife Sanctuary', type: 'Wildlife Sanctuary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.08, 20.18], [100.25, 20.18], [100.25, 20.35], [100.08, 20.35], [100.08, 20.18]
        ]]
      },
      properties: { NAME: 'Golden Triangle Forest', type: 'Reserved Forest' }
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
      provinces: demoProvinceData,
      amphoe: demoAmphoeData,
      forests: demoForestData
    }
  };
}
