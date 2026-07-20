/**
 * Demo GIS Data for Vercel deployment
 * Simplified but realistic GeoJSON for the อ.สามพราน / จ.นครปฐม study area.
 */

// Schools / institutions around Sam Phran (incl. the Royal Police Cadet Academy)
export const demoPointData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2160, 13.7170] },
      properties: { NAME: 'โรงเรียนนายร้อยตำรวจ (สามพราน)', type: 'Academy' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2670, 13.7270] },
      properties: { NAME: 'โรงเรียนวัดไร่ขิงวิทยา', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2050, 13.7050] },
      properties: { NAME: 'โรงเรียนสามพรานวิทยา', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2400, 13.7500] },
      properties: { NAME: 'โรงเรียน ภ.ป.ร. ราชวิทยาลัย', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.0600, 13.8200] },
      properties: { NAME: 'มหาวิทยาลัยคริสเตียน', type: 'University' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.2100, 13.8000] },
      properties: { NAME: 'โรงเรียนงิ้วรายบุญมีรังสฤษดิ์', type: 'School' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.3100, 13.7950] },
      properties: { NAME: 'มหาวิทยาลัยมหิดล ศาลายา', type: 'University' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [100.1800, 13.6950] },
      properties: { NAME: 'โรงเรียนวัดท่าข้าม', type: 'School' }
    }
  ]
};

// Major roads through Sam Phran (Phetkasem, Phutthamonthon Sai 4/5, Hwy 3316)
export const demoLineData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.0900, 13.7150], [100.1500, 13.7130], [100.2100, 13.7120],
          [100.2700, 13.7100], [100.3200, 13.7080]
        ]
      },
      properties: { NAME: 'ถนนเพชรเกษม (ทางหลวง 4)', type: 'Primary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.3000, 13.6700], [100.3010, 13.7500], [100.3020, 13.8300], [100.3050, 13.9000]
        ]
      },
      properties: { NAME: 'ถนนพุทธมณฑลสาย 4', type: 'Secondary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.2650, 13.6800], [100.2660, 13.7400], [100.2670, 13.8000], [100.2680, 13.8600]
        ]
      },
      properties: { NAME: 'ถนนพุทธมณฑลสาย 5', type: 'Secondary' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [100.1950, 13.6900], [100.2150, 13.7600], [100.2350, 13.8300]
        ]
      },
      properties: { NAME: 'ทางหลวงจังหวัด 3316', type: 'Secondary' }
    }
  ]
};

// Nakhon Pathom province boundary (simplified) — contains the Sam Phran markers
export const demoProvinceData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.9000, 13.7500], [100.0500, 13.6200], [100.2500, 13.6000],
          [100.3500, 13.7200], [100.3400, 13.9000], [100.2500, 14.0500],
          [100.1000, 14.1200], [99.9500, 14.0500], [99.8700, 13.9200],
          [99.8800, 13.8000], [99.9000, 13.7500]
        ]]
      },
      properties: {
        ADM1_EN: 'Nakhon Pathom',
        PROV_NAM_E: 'Nakhon Pathom',
        ADM1_TH: 'นครปฐม'
      }
    }
  ]
};

// Amphoe (districts) in Nakhon Pathom — Sam Phran and neighbours
export const demoAmphoeData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.15, 13.68], [100.30, 13.68], [100.30, 13.82], [100.15, 13.82], [100.15, 13.68]
        ]]
      },
      properties: { ADM2_EN: 'Sam Phran', ADM2_TH: 'สามพราน' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.15, 13.82], [100.30, 13.82], [100.30, 13.95], [100.15, 13.95], [100.15, 13.82]
        ]]
      },
      properties: { ADM2_EN: 'Nakhon Chai Si', ADM2_TH: 'นครชัยศรี' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.28, 13.76], [100.36, 13.76], [100.36, 13.88], [100.28, 13.88], [100.28, 13.76]
        ]]
      },
      properties: { ADM2_EN: 'Phutthamonthon', ADM2_TH: 'พุทธมณฑล' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [99.95, 13.78], [100.10, 13.78], [100.10, 13.92], [99.95, 13.92], [99.95, 13.78]
        ]]
      },
      properties: { ADM2_EN: 'Mueang Nakhon Pathom', ADM2_TH: 'เมืองนครปฐม' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.05, 13.95], [100.20, 13.95], [100.20, 14.08], [100.05, 14.08], [100.05, 13.95]
        ]]
      },
      properties: { ADM2_EN: 'Bang Len', ADM2_TH: 'บางเลน' }
    }
  ]
};

// Parks / green reserves near Sam Phran
export const demoForestData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.30, 13.78], [100.34, 13.78], [100.34, 13.83], [100.30, 13.83], [100.30, 13.78]
        ]]
      },
      properties: { NAME: 'พุทธมณฑล', type: 'Park' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.16, 13.70], [100.21, 13.70], [100.21, 13.75], [100.16, 13.75], [100.16, 13.70]
        ]]
      },
      properties: { NAME: 'สวนสามพราน (ริมแม่น้ำท่าจีน)', type: 'Riverside Park' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [100.24, 13.83], [100.29, 13.83], [100.29, 13.88], [100.24, 13.88], [100.24, 13.83]
        ]]
      },
      properties: { NAME: 'พื้นที่เกษตรไร่ขิง', type: 'Agricultural' }
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
