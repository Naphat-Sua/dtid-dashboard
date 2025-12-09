/**
 * Shapefile to GeoJSON Converter
 * Run this script to convert shapefiles to GeoJSON format for web use
 * 
 * Usage: node convertShapefiles.js
 */

import shapefile from 'shapefile';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base path to shapefile directory
const SHAPEFILE_BASE = '/Users/naphat/Downloads/drive-download-20251208T084919Z-3-001';
const OUTPUT_DIR = path.join(__dirname, '../public/geojson');

// Shapefile definitions
const SHAPEFILES = {
  // Point layers
  'schools': {
    shp: 'thai data shp/SchoolCollege/School_College.shp',
    dbf: 'thai data shp/SchoolCollege/School_College.dbf',
    type: 'point'
  },
  'tambon-centroids': {
    shp: 'tambon lat lon location/tambon lat lon location.shp',
    dbf: 'tambon lat lon location/tambon lat lon location.dbf',
    type: 'point'
  },
  
  // Line layers
  'roads': {
    shp: 'thai data shp/Road/Road/Road.shp',
    dbf: 'thai data shp/Road/Road/Road.dbf',
    type: 'line'
  },
  
  // Polygon layers
  'provinces': {
    shp: 'thai data shp/province/tha_admbnda_adm1_rtsd_20220121.shp',
    dbf: 'thai data shp/province/tha_admbnda_adm1_rtsd_20220121.dbf',
    type: 'polygon'
  },
  'forests': {
    shp: 'thai data shp/national_reserved_forest/national_reserved_forest_wgs84_z47.shp',
    dbf: 'thai data shp/national_reserved_forest/national_reserved_forest_wgs84_z47.dbf',
    type: 'polygon'
  },
  'amphoe': {
    shp: 'thailand shp/Amphoe/THA_Amphoe.shp',
    dbf: 'thailand shp/Amphoe/THA_Amphoe.dbf',
    type: 'polygon'
  },
  'tambon': {
    shp: 'thailand shp/Tambon/THA_Tambon.shp',
    dbf: 'thailand shp/Tambon/THA_Tambon.dbf',
    type: 'polygon'
  }
};

/**
 * Convert a shapefile to GeoJSON
 */
async function convertShapefile(name, config) {
  try {
    console.log(`Converting ${name}...`);
    
    const shpPath = path.join(SHAPEFILE_BASE, config.shp);
    const dbfPath = path.join(SHAPEFILE_BASE, config.dbf);
    
    const source = await shapefile.open(shpPath, dbfPath);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      if (result.value) {
        features.push(result.value);
      }
      result = await source.read();
    }
    
    const geojson = {
      type: 'FeatureCollection',
      features: features,
      metadata: {
        name: name,
        type: config.type,
        featureCount: features.length,
        convertedAt: new Date().toISOString()
      }
    };
    
    // Create output directory if it doesn't exist
    await fs.mkdir(path.join(OUTPUT_DIR, config.type), { recursive: true });
    
    // Write GeoJSON file
    const outputPath = path.join(OUTPUT_DIR, config.type, `${name}.json`);
    await fs.writeFile(outputPath, JSON.stringify(geojson, null, 2));
    
    console.log(`✓ ${name}: ${features.length} features → ${outputPath}`);
    return { name, success: true, features: features.length };
    
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
    return { name, success: false, error: error.message };
  }
}

/**
 * Convert all shapefiles
 */
async function convertAll() {
  console.log('Starting shapefile conversion...\n');
  console.log(`Source: ${SHAPEFILE_BASE}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);
  
  const results = [];
  
  for (const [name, config] of Object.entries(SHAPEFILES)) {
    const result = await convertShapefile(name, config);
    results.push(result);
  }
  
  console.log('\n=== Conversion Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\nSuccessful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`  ✓ ${r.name}: ${r.features} features`);
  });
  
  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`  ✗ ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\nDone! GeoJSON files are ready in:', OUTPUT_DIR);
  console.log('You can now load these files in your application.');
}

// Run conversion
convertAll().catch(console.error);
