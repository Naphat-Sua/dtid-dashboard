/**
 * Spatial Analysis Utilities for Crime Mapping
 * 
 * Includes:
 * - Kernel Density Estimation (KDE) for density mapping
 * - Getis-Ord Gi* Hotspot Analysis for statistical significance
 * - Z-score and P-value calculations
 */

// ============================================================
// CONSTANTS
// ============================================================

// Statistical thresholds for Gi* classification
const SIGNIFICANCE_LEVELS = {
  HOTSPOT_99: { zThreshold: 2.58, pValue: 0.01, label: 'Hotspot (99% Confidence)' },
  HOTSPOT_95: { zThreshold: 1.96, pValue: 0.05, label: 'Hotspot (95% Confidence)' },
  HOTSPOT_90: { zThreshold: 1.65, pValue: 0.10, label: 'Hotspot (90% Confidence)' },
  COLDSPOT_90: { zThreshold: -1.65, pValue: 0.10, label: 'Coldspot (90% Confidence)' },
  COLDSPOT_95: { zThreshold: -1.96, pValue: 0.05, label: 'Coldspot (95% Confidence)' },
  COLDSPOT_99: { zThreshold: -2.58, pValue: 0.01, label: 'Coldspot (99% Confidence)' },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate Haversine distance between two points (in kilometers)
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate the mean of an array
 */
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

/**
 * Calculate standard deviation
 */
const stdDev = (arr) => {
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
};

/**
 * Error function approximation for P-value calculation
 */
const erf = (x) => {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

/**
 * Calculate P-value from Z-score (two-tailed)
 */
export const zScoreToPValue = (z) => {
  return 1 - erf(Math.abs(z) / Math.sqrt(2));
};

// ============================================================
// KERNEL DENSITY ESTIMATION (KDE)
// ============================================================

/**
 * Gaussian Kernel function
 */
const gaussianKernel = (distance, bandwidth) => {
  const u = distance / bandwidth;
  return (1 / (bandwidth * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * u * u);
};

/**
 * Epanechnikov Kernel (more efficient, compact support)
 */
const epanechnikovKernel = (distance, bandwidth) => {
  const u = distance / bandwidth;
  if (Math.abs(u) <= 1) {
    return (3 / 4) * (1 - u * u) / bandwidth;
  }
  return 0;
};

/**
 * Generate a grid of points for KDE estimation
 */
export const generateGrid = (bounds, resolution = 50) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latStep = (maxLat - minLat) / resolution;
  const lngStep = (maxLng - minLng) / resolution;
  
  const grid = [];
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      grid.push({
        lat: minLat + i * latStep,
        lng: minLng + j * lngStep,
        row: i,
        col: j
      });
    }
  }
  return grid;
};

/**
 * Calculate optimal bandwidth using Silverman's rule of thumb
 */
export const calculateOptimalBandwidth = (points) => {
  if (points.length < 2) return 1;
  
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  
  const n = points.length;
  const stdLat = stdDev(lats);
  const stdLng = stdDev(lngs);
  const avgStd = (stdLat + stdLng) / 2;
  
  // Silverman's rule: h = 1.06 * σ * n^(-1/5)
  // Adjusted for geographic coordinates (roughly 111km per degree)
  return 1.06 * avgStd * Math.pow(n, -0.2) * 111;
};

/**
 * Perform Kernel Density Estimation
 * Returns a grid with density values
 */
export const performKDE = (points, options = {}) => {
  const {
    bandwidth = null,
    resolution = 50,
    kernel = 'gaussian',
    bounds = null,
    weights = null
  } = options;

  if (points.length === 0) {
    return { grid: [], maxDensity: 0, minDensity: 0, bandwidth: 0 };
  }

  // Calculate bounds if not provided
  const calcBounds = bounds || {
    minLat: Math.min(...points.map(p => p.lat)) - 0.1,
    maxLat: Math.max(...points.map(p => p.lat)) + 0.1,
    minLng: Math.min(...points.map(p => p.lng)) - 0.1,
    maxLng: Math.max(...points.map(p => p.lng)) + 0.1
  };

  // Calculate bandwidth if not provided
  const h = bandwidth || calculateOptimalBandwidth(points);
  
  // Select kernel function
  const kernelFn = kernel === 'epanechnikov' ? epanechnikovKernel : gaussianKernel;
  
  // Generate grid
  const grid = generateGrid(calcBounds, resolution);
  
  // Calculate density for each grid point
  grid.forEach(gridPoint => {
    let density = 0;
    points.forEach((point, idx) => {
      const distance = haversineDistance(gridPoint.lat, gridPoint.lng, point.lat, point.lng);
      const weight = weights ? weights[idx] : 1;
      density += weight * kernelFn(distance, h);
    });
    gridPoint.density = density;
  });

  // Normalize densities
  const densities = grid.map(g => g.density);
  const maxDensity = Math.max(...densities);
  const minDensity = Math.min(...densities);

  grid.forEach(g => {
    g.normalizedDensity = maxDensity > 0 ? g.density / maxDensity : 0;
  });

  return {
    grid,
    maxDensity,
    minDensity,
    bandwidth: h,
    bounds: calcBounds,
    resolution
  };
};

// ============================================================
// GETIS-ORD Gi* HOTSPOT ANALYSIS
// ============================================================

/**
 * Calculate spatial weight matrix based on distance threshold
 */
export const calculateSpatialWeights = (points, distanceThreshold) => {
  const n = points.length;
  const weights = [];
  
  for (let i = 0; i < n; i++) {
    weights[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        weights[i][j] = 1; // Include self for Gi*
      } else {
        const distance = haversineDistance(
          points[i].lat, points[i].lng,
          points[j].lat, points[j].lng
        );
        // Binary weight: 1 if within threshold, 0 otherwise
        weights[i][j] = distance <= distanceThreshold ? 1 : 0;
      }
    }
  }
  
  return weights;
};

/**
 * Calculate inverse distance weights
 */
export const calculateInverseDistanceWeights = (points, distanceThreshold, power = 1) => {
  const n = points.length;
  const weights = [];
  
  for (let i = 0; i < n; i++) {
    weights[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        weights[i][j] = 1;
      } else {
        const distance = haversineDistance(
          points[i].lat, points[i].lng,
          points[j].lat, points[j].lng
        );
        if (distance <= distanceThreshold && distance > 0) {
          weights[i][j] = 1 / Math.pow(distance, power);
        } else {
          weights[i][j] = 0;
        }
      }
    }
  }
  
  return weights;
};

/**
 * Perform Getis-Ord Gi* Analysis
 * 
 * The Gi* statistic identifies statistically significant hot spots and cold spots.
 * 
 * Correct Formula for Gi*:
 * Gi* = (Σj wij xj - X̄ * Σj wij) / (S * sqrt([n * Σj wij² - (Σj wij)²] / (n-1)))
 * 
 * Where:
 * - wij = spatial weight between feature i and j (including self when j=i)
 * - xj = attribute value for feature j
 * - X̄ = mean of all attribute values
 * - S = standard deviation of all attribute values
 * - n = total number of features
 */
export const performGetisOrdGiStar = (points, options = {}) => {
  const {
    distanceThreshold = null,
    weightType = 'fixed_distance', // 'fixed_distance' or 'inverse_distance'
    attributeField = 'value',
    fixedDistanceKm = null
  } = options;

  if (points.length < 3) {
    return {
      results: points.map(p => ({
        ...p,
        giStar: 0,
        zScore: 0,
        pValue: 1,
        classification: 'Not Significant'
      })),
      summary: {
        hotspots99: 0,
        hotspots95: 0,
        hotspots90: 0,
        coldspots90: 0,
        coldspots95: 0,
        coldspots99: 0,
        notSignificant: points.length
      }
    };
  }

  const n = points.length;
  
  // Get attribute values (crime counts/weights at each point)
  const values = points.map(p => {
    const val = p[attributeField];
    return (typeof val === 'number' && !isNaN(val)) ? val : 1;
  });
  
  // Calculate global statistics
  const xBar = mean(values);
  const S = stdDev(values);
  
  // Handle edge case where all values are the same (S = 0)
  if (S === 0) {
    return {
      results: points.map(p => ({
        ...p,
        giStar: 0,
        zScore: 0,
        pValue: 1,
        classification: 'Not Significant',
        confidenceLevel: 0,
        isHotspot: false,
        isColdspot: false,
        neighborsCount: 0
      })),
      summary: {
        hotspots99: 0,
        hotspots95: 0,
        hotspots90: 0,
        coldspots90: 0,
        coldspots95: 0,
        coldspots99: 0,
        notSignificant: points.length,
        totalHotspots: 0,
        totalColdspots: 0,
        distanceThreshold: 0,
        globalMean: xBar,
        globalStdDev: S
      }
    };
  }

  // Calculate distance threshold - use fixed distance or calculate from data
  // For crime analysis, typically use a distance that captures neighborhood effects
  const threshold = fixedDistanceKm || distanceThreshold || calculateAdaptiveThreshold(points);

  // Build spatial weights matrix
  const weights = [];
  for (let i = 0; i < n; i++) {
    weights[i] = [];
    for (let j = 0; j < n; j++) {
      const distance = haversineDistance(
        points[i].lat, points[i].lng,
        points[j].lat, points[j].lng
      );
      
      if (distance <= threshold) {
        // Binary weight within threshold (includes self when i===j, distance=0)
        weights[i][j] = 1;
      } else {
        weights[i][j] = 0;
      }
    }
  }

  // Calculate Gi* for each point
  const results = points.map((point, i) => {
    // Sum of weights for point i (includes neighbors within threshold)
    const sumWij = weights[i].reduce((a, b) => a + b, 0);
    
    // Sum of squared weights
    const sumWij2 = weights[i].reduce((a, b) => a + b * b, 0);
    
    // Weighted sum of attribute values (sum of xj for all neighbors including self)
    const sumWijXj = weights[i].reduce((sum, wij, j) => sum + wij * values[j], 0);

    // Gi* Numerator: Σ(wij * xj) - X̄ * Σwij
    const numerator = sumWijXj - (xBar * sumWij);

    // Gi* Denominator: S * sqrt((n * Σwij² - (Σwij)²) / (n-1))
    const varianceComponent = (n * sumWij2 - Math.pow(sumWij, 2)) / (n - 1);
    
    // Prevent negative values due to floating point errors
    const denominator = S * Math.sqrt(Math.max(0, varianceComponent));

    // Calculate Z-score (Gi* statistic)
    let zScore = 0;
    if (denominator > 0) {
      zScore = numerator / denominator;
    }
    
    // Calculate p-value from z-score
    const pValue = zScoreToPValue(zScore);

    // Classify the result based on z-score thresholds
    let classification = 'Not Significant';
    let confidenceLevel = 0;

    if (zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.HOTSPOT_99.label;
      confidenceLevel = 99;
    } else if (zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.HOTSPOT_95.label;
      confidenceLevel = 95;
    } else if (zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.HOTSPOT_90.label;
      confidenceLevel = 90;
    } else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.COLDSPOT_99.label;
      confidenceLevel = 99;
    } else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.COLDSPOT_95.label;
      confidenceLevel = 95;
    } else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold) {
      classification = SIGNIFICANCE_LEVELS.COLDSPOT_90.label;
      confidenceLevel = 90;
    }

    return {
      ...point,
      giStar: zScore,
      zScore,
      pValue,
      classification,
      confidenceLevel,
      isHotspot: zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold,
      isColdspot: zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold,
      neighborsCount: sumWij - 1, // Exclude self from neighbor count
      sumWij,
      sumWijXj
    };
  });

  // Calculate summary statistics
  const summary = {
    hotspots99: results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold).length,
    hotspots95: results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold && r.zScore < SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold).length,
    hotspots90: results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold && r.zScore < SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold).length,
    coldspots90: results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold && r.zScore > SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold).length,
    coldspots95: results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold && r.zScore > SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold).length,
    coldspots99: results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold).length,
    notSignificant: results.filter(r => !r.isHotspot && !r.isColdspot).length,
    totalHotspots: results.filter(r => r.isHotspot).length,
    totalColdspots: results.filter(r => r.isColdspot).length,
    distanceThreshold: threshold,
    globalMean: xBar,
    globalStdDev: S
  };

  return {
    results,
    summary,
    weights
  };
};

/**
 * Calculate adaptive distance threshold based on point distribution
 * Uses a combination of average nearest neighbor and study area extent
 */
const calculateAdaptiveThreshold = (points) => {
  const n = points.length;
  if (n < 2) return 10; // Default 10km
  
  // Calculate bounding box
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Calculate study area diagonal
  const diagonal = haversineDistance(minLat, minLng, maxLat, maxLng);
  
  // Calculate average nearest neighbor distance
  let totalNearestDist = 0;
  points.forEach((p1, i) => {
    let minDist = Infinity;
    points.forEach((p2, j) => {
      if (i !== j) {
        const dist = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        if (dist < minDist) minDist = dist;
      }
    });
    if (minDist !== Infinity) totalNearestDist += minDist;
  });
  const avgNearestNeighbor = totalNearestDist / n;
  
  // Use threshold that balances local clustering with broader patterns
  // Typically 1-3x the average nearest neighbor distance works well
  // But cap it at 1/4 of the study area diagonal to avoid over-smoothing
  const threshold = Math.min(
    avgNearestNeighbor * 2.5,
    diagonal / 4,
    15 // Cap at 15km maximum for practical crime analysis
  );
  
  return Math.max(threshold, 1); // Minimum 1km
};

/**
 * Calculate default distance threshold using average nearest neighbor
 */
const calculateDefaultThreshold = (points) => {
  const distances = [];
  
  points.forEach((p1, i) => {
    let minDist = Infinity;
    points.forEach((p2, j) => {
      if (i !== j) {
        const dist = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        if (dist < minDist) {
          minDist = dist;
        }
      }
    });
    if (minDist !== Infinity) {
      distances.push(minDist);
    }
  });

  // Use 2x average nearest neighbor distance as threshold
  return mean(distances) * 2;
};

// ============================================================
// COMBINED ANALYSIS (KDE + Gi*)
// ============================================================

/**
 * Perform comprehensive spatial analysis combining KDE and Getis-Ord Gi*
 */
export const performSpatialAnalysis = (points, options = {}) => {
  const {
    kdeResolution = 40,
    kdeBandwidth = null,
    giDistanceThreshold = null,
    giWeightType = 'binary'
  } = options;

  // Prepare points with default values
  const preparedPoints = points.map((p, idx) => ({
    id: p.id || idx,
    lat: p.lat || p.Latitude,
    lng: p.lng || p.Longitude,
    value: p.value || p.intensity || 1,
    ...p
  }));

  // Perform KDE
  const kdeResult = performKDE(preparedPoints, {
    resolution: kdeResolution,
    bandwidth: kdeBandwidth
  });

  // Perform Getis-Ord Gi* on the original points
  const giResult = performGetisOrdGiStar(preparedPoints, {
    distanceThreshold: giDistanceThreshold,
    weightType: giWeightType,
    attributeField: 'value'
  });

  return {
    kde: kdeResult,
    giStar: giResult,
    points: preparedPoints
  };
};

// ============================================================
// VISUALIZATION HELPERS
// ============================================================

/**
 * Get color for hotspot/coldspot classification
 */
export const getHotspotColor = (zScore, opacity = 1) => {
  if (zScore >= 2.58) return `rgba(139, 0, 0, ${opacity})`; // Dark red - 99% hotspot
  if (zScore >= 1.96) return `rgba(220, 38, 38, ${opacity})`; // Red - 95% hotspot
  if (zScore >= 1.65) return `rgba(251, 146, 60, ${opacity})`; // Orange - 90% hotspot
  if (zScore <= -2.58) return `rgba(30, 58, 138, ${opacity})`; // Dark blue - 99% coldspot
  if (zScore <= -1.96) return `rgba(59, 130, 246, ${opacity})`; // Blue - 95% coldspot
  if (zScore <= -1.65) return `rgba(147, 197, 253, ${opacity})`; // Light blue - 90% coldspot
  return `rgba(156, 163, 175, ${opacity})`; // Gray - not significant
};

/**
 * Get classification label
 */
export const getClassificationLabel = (zScore) => {
  if (zScore >= 2.58) return 'Hotspot (99% CI)';
  if (zScore >= 1.96) return 'Hotspot (95% CI)';
  if (zScore >= 1.65) return 'Hotspot (90% CI)';
  if (zScore <= -2.58) return 'Coldspot (99% CI)';
  if (zScore <= -1.96) return 'Coldspot (95% CI)';
  if (zScore <= -1.65) return 'Coldspot (90% CI)';
  return 'Not Significant';
};

/**
 * Convert KDE grid to GeoJSON for visualization
 */
export const kdeToContours = (kdeResult, thresholds = [0.2, 0.4, 0.6, 0.8]) => {
  const { grid, resolution, bounds } = kdeResult;
  
  // Create 2D array for contouring
  const values = [];
  for (let i = 0; i <= resolution; i++) {
    values[i] = [];
    for (let j = 0; j <= resolution; j++) {
      const point = grid.find(g => g.row === i && g.col === j);
      values[i][j] = point ? point.normalizedDensity : 0;
    }
  }

  return {
    values,
    bounds,
    thresholds
  };
};

export default {
  performKDE,
  performGetisOrdGiStar,
  performSpatialAnalysis,
  haversineDistance,
  getHotspotColor,
  getClassificationLabel,
  zScoreToPValue
};
