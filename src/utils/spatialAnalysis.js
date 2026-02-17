/**
 * Spatial Analysis Engine — Scientifically Rigorous Implementation
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │  KDE: True kernel density estimation with                   │
 * │       Gaussian / Epanechnikov / Quartic kernels,            │
 * │       Silverman's rule + Scott's factor bandwidth,          │
 * │       zoom-adaptive grid resolution,                        │
 * │       canvas-ready raster output.                           │
 * │                                                             │
 * │  Gi*: Getis-Ord Gi* with proper spatial weight matrix,     │
 * │       binary & inverse-distance weights,                    │
 * │       exact Z-score / P-value,                              │
 * │       multi-level significance classification.              │
 * └─────────────────────────────────────────────────────────────┘
 */

// ============================================================
//  CONSTANTS
// ============================================================

/** Statistical Z-thresholds for Gi* classification */
export const SIGNIFICANCE_LEVELS = {
  HOTSPOT_99:  { zThreshold:  2.576, pValue: 0.01, label: 'Hotspot — 99 % Confidence' },
  HOTSPOT_95:  { zThreshold:  1.960, pValue: 0.05, label: 'Hotspot — 95 % Confidence' },
  HOTSPOT_90:  { zThreshold:  1.645, pValue: 0.10, label: 'Hotspot — 90 % Confidence' },
  COLDSPOT_90: { zThreshold: -1.645, pValue: 0.10, label: 'Coldspot — 90 % Confidence' },
  COLDSPOT_95: { zThreshold: -1.960, pValue: 0.05, label: 'Coldspot — 95 % Confidence' },
  COLDSPOT_99: { zThreshold: -2.576, pValue: 0.01, label: 'Coldspot — 99 % Confidence' },
};

/** Available kernel functions with metadata (for UI selectors) */
export const KERNEL_OPTIONS = [
  { id: 'gaussian',      label: 'Gaussian',       compact: false,
    description: 'Smooth bell curve — infinite support, best for smooth density surfaces.' },
  { id: 'epanechnikov',  label: 'Epanechnikov',   compact: true,
    description: 'Parabolic kernel — compact support, optimal MISE efficiency.' },
  { id: 'quartic',       label: 'Quartic (Biweight)', compact: true,
    description: 'Smooth compact kernel — smoother than Epanechnikov, widely used in GIS.' },
];

/** Reasonable parameter ranges for UI sliders */
export const PARAM_RANGES = {
  bandwidth:         { min: 0.5, max: 50,  step: 0.5,  unit: 'km',    defaultAuto: true },
  resolution:        { min: 20,  max: 200, step: 10,   unit: 'cells' },
  distanceThreshold: { min: 0.5, max: 30,  step: 0.5,  unit: 'km',    defaultAuto: true },
  confidenceLevel:   { min: 80,  max: 99,  step: 1,    unit: '%' },
};

// Earth radius in km
const R_EARTH = 6371;

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

/**
 * Haversine distance (km) between two geographic points.
 */
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLng / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Arithmetic mean */
const mean = (arr) => {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
};

/** Population standard deviation */
const stdDev = (arr) => {
  const m = mean(arr);
  let ss = 0;
  for (let i = 0; i < arr.length; i++) ss += (arr[i] - m) ** 2;
  return Math.sqrt(ss / arr.length);
};

/**
 * Horner-form error function approximation (Abramowitz & Stegun 7.1.26).
 * Max error |ε| < 1.5 × 10⁻⁷.
 */
const erf = (x) => {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
};

/** Two-tailed P-value from Z-score using error function. */
export const zScoreToPValue = (z) => 1 - erf(Math.abs(z) / Math.SQRT2);

// ============================================================
//  KERNEL FUNCTIONS
//  All kernels K(u) are normalised so ∫K(u)du = 1
//  They accept (distance_km, bandwidth_km) and return density.
// ============================================================

/**
 * Gaussian kernel:  K(u) = (1 / √(2π)) · e^(−u²/2) / h
 * Infinite support — every point contributes everywhere.
 */
const gaussianKernel = (distance, bandwidth) => {
  const u = distance / bandwidth;
  return (1 / (bandwidth * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * u * u);
};

/**
 * Epanechnikov kernel:  K(u) = (3/4)(1 − u²)/h   for |u| ≤ 1
 * Optimal in a minimum integrated squared error (MISE) sense.
 */
const epanechnikovKernel = (distance, bandwidth) => {
  const u = distance / bandwidth;
  if (u > 1) return 0;
  return (3 / 4) * (1 - u * u) / bandwidth;
};

/**
 * Quartic (bi-weight) kernel:  K(u) = (15/16)(1 − u²)²/h   for |u| ≤ 1
 * Smoother than Epanechnikov with compact support — standard in ArcGIS/QGIS.
 */
const quarticKernel = (distance, bandwidth) => {
  const u = distance / bandwidth;
  if (u > 1) return 0;
  return (15 / 16) * ((1 - u * u) ** 2) / bandwidth;
};

/** Kernel function lookup */
const KERNELS = {
  gaussian:     gaussianKernel,
  epanechnikov: epanechnikovKernel,
  quartic:      quarticKernel,
};

// ============================================================
//  BANDWIDTH ESTIMATION
// ============================================================

/**
 * Silverman's Rule of Thumb (1986)
 *
 *   h = 0.9 · min(σ, IQR/1.34) · n^(−1/5)
 *
 * Operates on geographic coordinates — returns bandwidth in **km**.
 * Uses the robust estimator (IQR variant) to resist outliers.
 */
export const calculateOptimalBandwidth = (points) => {
  if (points.length < 2) return 5; // 5 km fallback

  const n = points.length;
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);

  // Convert geographic spread to km (rough mid-latitude approximation)
  const midLat = mean(lats);
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(midLat * Math.PI / 180);

  const latsKm = lats.map(l => l * kmPerDegLat);
  const lngsKm = lngs.map(l => l * kmPerDegLng);

  // Compute robust spread estimator for each axis
  const robustSpread = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(arr.length * 0.25)];
    const q3 = sorted[Math.floor(arr.length * 0.75)];
    const iqr = q3 - q1;
    const sigma = stdDev(arr);
    return Math.min(sigma, iqr / 1.34);
  };

  const spreadLat = robustSpread(latsKm);
  const spreadLng = robustSpread(lngsKm);
  const avgSpread = (spreadLat + spreadLng) / 2;

  // Silverman's rule
  const h = 0.9 * avgSpread * Math.pow(n, -0.2);

  // Clamp to sensible crime-analysis range
  return Math.max(1, Math.min(h, 50));
};

/**
 * Scott's Rule (alternative — simpler, assumes normality)
 *   h = 1.06 · σ · n^(−1/5)
 */
export const calculateScottBandwidth = (points) => {
  if (points.length < 2) return 5;
  const n = points.length;
  const midLat = mean(points.map(p => p.lat));
  const kmPerDeg = 111.32;
  const kmPerDegLng = kmPerDeg * Math.cos(midLat * Math.PI / 180);

  const sigLat = stdDev(points.map(p => p.lat * kmPerDeg));
  const sigLng = stdDev(points.map(p => p.lng * kmPerDegLng));
  const sigma  = (sigLat + sigLng) / 2;

  return Math.max(1, Math.min(1.06 * sigma * Math.pow(n, -0.2), 50));
};

// ============================================================
//  GRID GENERATION — Zoom-Adaptive Resolution
// ============================================================

/**
 * Choose grid resolution dynamically based on Leaflet zoom level.
 *
 * @param {number} zoom — Leaflet map zoom level (0-18)
 * @returns {number} cells per axis (resolution)
 */
export const getAdaptiveResolution = (zoom) => {
  // Base cells per axis at zoom 10
  const BASE = 50;
  // Each zoom level ≈ ×1.3 resolution, capped for performance
  const factor = Math.pow(1.3, (zoom || 10) - 10);
  const adaptive = Math.round(BASE * factor);
  return Math.max(20, Math.min(adaptive, 200));
};

/**
 * Generate a rectangular grid covering the bounds.
 * Returns typed-array backed grid for performance.
 */
export const generateGrid = (bounds, resolution = 50) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latStep = (maxLat - minLat) / resolution;
  const lngStep = (maxLng - minLng) / resolution;
  const rows = resolution + 1;
  const cols = resolution + 1;
  const total = rows * cols;

  const lats    = new Float64Array(total);
  const lngs    = new Float64Array(total);
  const density = new Float64Array(total);

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      lats[idx] = minLat + r * latStep;
      lngs[idx] = minLng + c * lngStep;
      idx++;
    }
  }

  return { lats, lngs, density, rows, cols, bounds, latStep, lngStep };
};

// ============================================================
//  KERNEL DENSITY ESTIMATION  (True Raster KDE)
// ============================================================

/**
 * Perform scientifically rigorous Kernel Density Estimation.
 *
 * Returns a raster grid of density values ready for canvas rendering.
 *
 * @param {Array<{lat,lng,value?}>} points
 * @param {Object} options
 */
export const performKDE = (points, options = {}) => {
  const {
    bandwidth  = null,
    resolution = null,
    kernel     = 'quartic',
    bounds     = null,
    zoom       = null,
    weights    = null,
  } = options;

  if (!points || points.length === 0) {
    return { grid: null, maxDensity: 0, minDensity: 0, bandwidth: 0, resolution: 0, bounds: null };
  }

  // 1) Calculate bandwidth (km)
  const h = bandwidth || calculateOptimalBandwidth(points);

  // Convert bandwidth km → approximate degrees for padding
  const midLat = mean(points.map(p => p.lat));
  const degPerKmLat = 1 / 111.32;
  const degPerKmLng = 1 / (111.32 * Math.cos(midLat * Math.PI / 180));
  const padLat = h * degPerKmLat;
  const padLng = h * degPerKmLng;

  const calcBounds = bounds || {
    minLat: Math.min(...points.map(p => p.lat)) - padLat,
    maxLat: Math.max(...points.map(p => p.lat)) + padLat,
    minLng: Math.min(...points.map(p => p.lng)) - padLng,
    maxLng: Math.max(...points.map(p => p.lng)) + padLng,
  };

  // 2) Determine resolution
  const res = resolution || (zoom != null ? getAdaptiveResolution(zoom) : 60);

  // 3) Build grid
  const grid = generateGrid(calcBounds, res);
  const kernelFn = KERNELS[kernel] || quarticKernel;
  const isCompact = kernel !== 'gaussian';

  // Pre-extract point data
  const nPts = points.length;
  const ptLat = new Float64Array(nPts);
  const ptLng = new Float64Array(nPts);
  const ptW   = new Float64Array(nPts);

  for (let k = 0; k < nPts; k++) {
    ptLat[k] = points[k].lat;
    ptLng[k] = points[k].lng;
    ptW[k]   = weights ? weights[k] : (points[k].value || 1);
  }

  // 4) Evaluate kernel at every grid cell — with spatial clipping
  const { lats, lngs, density, rows, cols } = grid;
  const total = rows * cols;
  const clipRadius = isCompact ? h : h * 3; // 3σ clip for Gaussian
  const clipLat = clipRadius * degPerKmLat;
  const clipLng = clipRadius * degPerKmLng;

  for (let k = 0; k < nPts; k++) {
    const pLat = ptLat[k];
    const pLng = ptLng[k];
    const w    = ptW[k];

    const rMin = Math.max(0, Math.floor((pLat - clipLat - calcBounds.minLat) / grid.latStep));
    const rMax = Math.min(rows - 1, Math.ceil((pLat + clipLat - calcBounds.minLat) / grid.latStep));
    const cMin = Math.max(0, Math.floor((pLng - clipLng - calcBounds.minLng) / grid.lngStep));
    const cMax = Math.min(cols - 1, Math.ceil((pLng + clipLng - calcBounds.minLng) / grid.lngStep));

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const idx = r * cols + c;
        const dist = haversineDistance(lats[idx], lngs[idx], pLat, pLng);
        if (dist <= clipRadius) {
          density[idx] += w * kernelFn(dist, h);
        }
      }
    }
  }

  // 5) Compute min/max and normalised layer
  let minD = Infinity, maxD = -Infinity;
  for (let i = 0; i < total; i++) {
    if (density[i] < minD) minD = density[i];
    if (density[i] > maxD) maxD = density[i];
  }
  if (maxD === minD) maxD = minD + 1;

  const normalised = new Float64Array(total);
  for (let i = 0; i < total; i++) {
    normalised[i] = (density[i] - minD) / (maxD - minD);
  }

  return {
    grid: { ...grid, normalised },
    maxDensity: maxD,
    minDensity: minD,
    bandwidth: h,
    resolution: res,
    bounds: calcBounds,
    kernel,
  };
};

// ============================================================
//  KDE → Canvas ImageData  (for L.ImageOverlay)
// ============================================================

/**
 * Render a KDE result to an RGBA pixel buffer.
 * The caller draws this onto a <canvas> for L.imageOverlay().
 *
 * @param {Object} kdeResult  — output of performKDE()
 * @param {'fire'|'viridis'|'cool'} colormap
 * @param {number} opacity    — global alpha multiplier 0-1
 * @returns {{ imageData: Uint8ClampedArray, width, height, bounds }}
 */
export const kdeToImageData = (kdeResult, colormap = 'fire', opacity = 0.7) => {
  if (!kdeResult || !kdeResult.grid) return null;

  const { grid, bounds } = kdeResult;
  const { normalised, rows, cols } = grid;
  const width  = cols;
  const height = rows;
  const buf = new Uint8ClampedArray(width * height * 4);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const srcIdx = r * cols + c;
      // Canvas row 0 = top of image = maxLat, so flip vertically
      const dstRow = (rows - 1 - r);
      const dstIdx = (dstRow * cols + c) * 4;
      const v = normalised[srcIdx];

      if (v < 0.01) {
        buf[dstIdx] = buf[dstIdx + 1] = buf[dstIdx + 2] = 0;
        buf[dstIdx + 3] = 0;
        continue;
      }

      const [cr, cg, cb] = colormapLookup(v, colormap);
      const alpha = Math.round(v * opacity * 255);
      buf[dstIdx]     = cr;
      buf[dstIdx + 1] = cg;
      buf[dstIdx + 2] = cb;
      buf[dstIdx + 3] = alpha;
    }
  }

  return { imageData: buf, width, height, bounds };
};

/**
 * Colour-map lookup: value ∈ [0, 1] → [R, G, B]
 */
const colormapLookup = (v, name = 'fire') => {
  const maps = {
    fire: [
      [0.00, 254, 243, 199],
      [0.15, 252, 211,  77],
      [0.30, 249, 115,  22],
      [0.45, 234,  88,  12],
      [0.60, 220,  38,  38],
      [0.75, 185,  28,  28],
      [0.90, 153,  27,  27],
      [1.00, 127,  29,  29],
    ],
    viridis: [
      [0.00,  68,   1,  84],
      [0.25,  59,  82, 139],
      [0.50,  33, 145, 140],
      [0.75,  94, 201,  98],
      [1.00, 253, 231,  37],
    ],
    cool: [
      [0.00,  30,  58, 138],
      [0.25,  59, 130, 246],
      [0.50, 147, 197, 253],
      [0.75, 252, 211,  77],
      [1.00, 220,  38,  38],
    ],
  };

  const stops = maps[name] || maps.fire;
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i][0] && v <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = (hi[0] - lo[0]) === 0 ? 0 : (v - lo[0]) / (hi[0] - lo[0]);
  return [
    Math.round(lo[1] + t * (hi[1] - lo[1])),
    Math.round(lo[2] + t * (hi[2] - lo[2])),
    Math.round(lo[3] + t * (hi[3] - lo[3])),
  ];
};

// ============================================================
//  GETIS-ORD Gi* HOTSPOT ANALYSIS
// ============================================================

/**
 * Build a spatial weight matrix.
 */
export const buildWeightMatrix = (points, threshold, type = 'binary', idwPower = 1) => {
  const n = points.length;
  const W = new Array(n);

  for (let i = 0; i < n; i++) {
    W[i] = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      if (i === j) {
        W[i][j] = 1; // Gi* includes self
        continue;
      }
      const d = haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (d > threshold) {
        W[i][j] = 0;
      } else if (type === 'inverse_distance' && d > 0) {
        W[i][j] = 1 / Math.pow(d, idwPower);
      } else {
        W[i][j] = 1;
      }
    }
  }
  return W;
};

/**
 * Calculate adaptive distance threshold from data distribution.
 * Uses avg nearest-neighbour × 2.5, capped at diagonal/4 and 15 km.
 */
export const calculateAdaptiveThreshold = (points) => {
  const n = points.length;
  if (n < 2) return 10;

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const diagonal = haversineDistance(
    Math.min(...lats), Math.min(...lngs),
    Math.max(...lats), Math.max(...lngs)
  );

  let totalNN = 0;
  for (let i = 0; i < n; i++) {
    let minD = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
      if (d < minD) minD = d;
    }
    if (minD !== Infinity) totalNN += minD;
  }
  const avgNN = totalNN / n;

  return Math.max(1, Math.min(avgNN * 2.5, diagonal / 4, 15));
};

/**
 * Perform Getis-Ord Gi* Analysis
 *
 * Formula:
 *            Σⱼ wᵢⱼ xⱼ  −  X̄ · Σⱼ wᵢⱼ
 *   Gi* = ─────────────────────────────────
 *          S · √[ (n · Σⱼ wᵢⱼ² − (Σⱼ wᵢⱼ)²) / (n − 1) ]
 */
export const performGetisOrdGiStar = (points, options = {}) => {
  const {
    distanceThreshold = null,
    weightType        = 'binary',
    attributeField    = 'value',
    idwPower          = 1,
  } = options;

  if (points.length < 3) {
    const stub = points.map(p => ({
      ...p, giStar: 0, zScore: 0, pValue: 1,
      classification: 'Not Significant', confidenceLevel: 0,
      isHotspot: false, isColdspot: false, neighborsCount: 0,
    }));
    return { results: stub, summary: _emptySummary(points.length, 0, 0, 0) };
  }

  const n = points.length;
  const values = points.map(p => {
    const v = p[attributeField];
    return typeof v === 'number' && !isNaN(v) ? v : 1;
  });

  const xBar = mean(values);
  const S    = stdDev(values);

  if (S === 0) {
    const stub = points.map(p => ({
      ...p, giStar: 0, zScore: 0, pValue: 1,
      classification: 'Not Significant', confidenceLevel: 0,
      isHotspot: false, isColdspot: false, neighborsCount: 0,
    }));
    return { results: stub, summary: _emptySummary(n, 0, xBar, S) };
  }

  const threshold = distanceThreshold || calculateAdaptiveThreshold(points);
  const W = buildWeightMatrix(points, threshold, weightType, idwPower);

  const results = points.map((point, i) => {
    let sumW = 0, sumW2 = 0, sumWX = 0;
    for (let j = 0; j < n; j++) {
      const w = W[i][j];
      sumW  += w;
      sumW2 += w * w;
      sumWX += w * values[j];
    }

    const numerator = sumWX - xBar * sumW;
    const varComp   = (n * sumW2 - sumW * sumW) / (n - 1);
    const denom     = S * Math.sqrt(Math.max(0, varComp));
    const zScore    = denom > 0 ? numerator / denom : 0;
    const pValue    = zScoreToPValue(zScore);

    let classification = 'Not Significant';
    let confidenceLevel = 0;

    if      (zScore >=  SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold)  { classification = SIGNIFICANCE_LEVELS.HOTSPOT_99.label;  confidenceLevel = 99; }
    else if (zScore >=  SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold)  { classification = SIGNIFICANCE_LEVELS.HOTSPOT_95.label;  confidenceLevel = 95; }
    else if (zScore >=  SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold)  { classification = SIGNIFICANCE_LEVELS.HOTSPOT_90.label;  confidenceLevel = 90; }
    else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold) { classification = SIGNIFICANCE_LEVELS.COLDSPOT_99.label; confidenceLevel = 99; }
    else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold) { classification = SIGNIFICANCE_LEVELS.COLDSPOT_95.label; confidenceLevel = 95; }
    else if (zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold) { classification = SIGNIFICANCE_LEVELS.COLDSPOT_90.label; confidenceLevel = 90; }

    return {
      ...point,
      giStar: zScore,
      zScore,
      pValue,
      classification,
      confidenceLevel,
      isHotspot:  zScore >=  SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold,
      isColdspot: zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold,
      neighborsCount: sumW - 1,
      sumWij: sumW,
      sumWijXj: sumWX,
    };
  });

  const summary = {
    hotspots99:     results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold).length,
    hotspots95:     results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold && r.zScore < SIGNIFICANCE_LEVELS.HOTSPOT_99.zThreshold).length,
    hotspots90:     results.filter(r => r.zScore >= SIGNIFICANCE_LEVELS.HOTSPOT_90.zThreshold && r.zScore < SIGNIFICANCE_LEVELS.HOTSPOT_95.zThreshold).length,
    coldspots90:    results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_90.zThreshold && r.zScore > SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold).length,
    coldspots95:    results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_95.zThreshold && r.zScore > SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold).length,
    coldspots99:    results.filter(r => r.zScore <= SIGNIFICANCE_LEVELS.COLDSPOT_99.zThreshold).length,
    notSignificant: results.filter(r => !r.isHotspot && !r.isColdspot).length,
    totalHotspots:  results.filter(r => r.isHotspot).length,
    totalColdspots: results.filter(r => r.isColdspot).length,
    distanceThreshold: threshold,
    weightType,
    globalMean: xBar,
    globalStdDev: S,
  };

  return { results, summary };
};

/** Helper — empty summary for edge cases */
const _emptySummary = (n, threshold, globalMean, globalStdDev) => ({
  hotspots99: 0, hotspots95: 0, hotspots90: 0,
  coldspots90: 0, coldspots95: 0, coldspots99: 0,
  notSignificant: n, totalHotspots: 0, totalColdspots: 0,
  distanceThreshold: threshold, weightType: 'binary',
  globalMean, globalStdDev,
});

// ============================================================
//  COMBINED ANALYSIS ORCHESTRATOR
// ============================================================

/**
 * Run KDE + Gi* in one call. Parameters are passed through from the UI.
 */
export const performSpatialAnalysis = (points, options = {}) => {
  const {
    kdeResolution       = null,
    kdeBandwidth        = null,
    kdeKernel           = 'quartic',
    giDistanceThreshold = null,
    giWeightType        = 'binary',
    giIdwPower          = 1,
    zoom                = null,
  } = options;

  const prepared = points.map((p, i) => ({
    id: p.id || i,
    lat: p.lat ?? p.Latitude,
    lng: p.lng ?? p.Longitude,
    value: p.value ?? p.intensity ?? 1,
    ...p,
  }));

  const kde = performKDE(prepared, {
    resolution: kdeResolution,
    bandwidth:  kdeBandwidth,
    kernel:     kdeKernel,
    zoom,
  });

  const giStar = performGetisOrdGiStar(prepared, {
    distanceThreshold: giDistanceThreshold,
    weightType:        giWeightType,
    attributeField:    'value',
    idwPower:          giIdwPower,
  });

  return { kde, giStar, points: prepared };
};

// ============================================================
//  VISUALISATION HELPERS
// ============================================================

/** Get colour for hotspot/coldspot by Z-score */
export const getHotspotColor = (zScore, opacity = 1) => {
  if (zScore >=  2.576) return `rgba(139,   0,   0, ${opacity})`;
  if (zScore >=  1.960) return `rgba(220,  38,  38, ${opacity})`;
  if (zScore >=  1.645) return `rgba(251, 146,  60, ${opacity})`;
  if (zScore <= -2.576) return `rgba( 30,  58, 138, ${opacity})`;
  if (zScore <= -1.960) return `rgba( 59, 130, 246, ${opacity})`;
  if (zScore <= -1.645) return `rgba(147, 197, 253, ${opacity})`;
  return `rgba(156, 163, 175, ${opacity})`;
};

/** Human-readable classification label */
export const getClassificationLabel = (zScore) => {
  if (zScore >=  2.576) return 'Hotspot (99 % CI)';
  if (zScore >=  1.960) return 'Hotspot (95 % CI)';
  if (zScore >=  1.645) return 'Hotspot (90 % CI)';
  if (zScore <= -2.576) return 'Coldspot (99 % CI)';
  if (zScore <= -1.960) return 'Coldspot (95 % CI)';
  if (zScore <= -1.645) return 'Coldspot (90 % CI)';
  return 'Not Significant';
};

export default {
  performKDE,
  performGetisOrdGiStar,
  performSpatialAnalysis,
  kdeToImageData,
  haversineDistance,
  calculateOptimalBandwidth,
  calculateScottBandwidth,
  getAdaptiveResolution,
  calculateAdaptiveThreshold,
  buildWeightMatrix,
  getHotspotColor,
  getClassificationLabel,
  zScoreToPValue,
  SIGNIFICANCE_LEVELS,
  KERNEL_OPTIONS,
  PARAM_RANGES,
};
