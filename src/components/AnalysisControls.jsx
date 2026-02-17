import React, { useState, useCallback } from 'react';
import {
  SlidersHorizontal, ChevronDown, ChevronUp, Info, Sparkles,
  Flame, Snowflake, BarChart3, Sigma, CircleDot, Ruler, Grid3X3,
  BookOpen, X
} from 'lucide-react';
import {
  KERNEL_OPTIONS,
  PARAM_RANGES,
  SIGNIFICANCE_LEVELS,
  calculateOptimalBandwidth,
  calculateAdaptiveThreshold,
} from '../utils/spatialAnalysis';

// ── Methodology popover content ──
const METHODOLOGY = {
  kde: {
    title: 'Kernel Density Estimation (KDE)',
    formula: 'f̂(x) = (1/nh) Σᵢ K((x − xᵢ)/h)',
    sections: [
      {
        param: 'Bandwidth (h)',
        detail: 'Controls the smoothness of the density surface. Silverman\'s Rule: h = 0.9 · min(σ, IQR/1.34) · n^(−1/5). Larger h → smoother surface, may mask local peaks. Smaller h → noisier, reveals fine detail.',
      },
      {
        param: 'Kernel Function',
        detail: 'The weighting function applied to each data point. Gaussian has infinite reach; Quartic & Epanechnikov have compact support (zero outside bandwidth radius). Choice has minor effect on shape but affects computation speed.',
      },
      {
        param: 'Grid Resolution',
        detail: 'Number of cells per axis in the output raster. Higher resolution → finer detail but slower computation. Auto-adapts to map zoom level when set to "Auto".',
      },
    ],
  },
  giStar: {
    title: 'Getis-Ord Gi* Statistic',
    formula: 'Gi* = (Σⱼ wᵢⱼxⱼ − X̄ΣⱼWᵢⱼ) / (S · √[(nΣⱼwᵢⱼ² − (Σⱼwᵢⱼ)²)/(n−1)])',
    sections: [
      {
        param: 'Z-Score',
        detail: 'Measures how many standard deviations a location\'s local sum deviates from the expected random pattern. Z > 1.96 → significant clustering of high values (hotspot). Z < −1.96 → significant clustering of low values (coldspot).',
      },
      {
        param: 'Distance Threshold',
        detail: 'Defines the neighbourhood radius. Points within this distance are "neighbours" and receive non-zero weights. Auto-calculated as 2.5× average nearest-neighbour distance.',
      },
      {
        param: 'Weight Type',
        detail: 'Binary: all neighbours weighted equally (wᵢⱼ = 1). Inverse Distance: closer neighbours weighted more (wᵢⱼ = 1/dᵢⱼ). IDW often reveals tighter clusters.',
      },
      {
        param: 'P-Value',
        detail: 'Probability that the observed clustering occurred by random chance. P < 0.01 → 99% confidence the pattern is real. Calculated from the Z-score using the standard normal CDF.',
      },
    ],
  },
};

// ── Slider sub-component ──
const ParamSlider = ({ label, value, onChange, min, max, step, unit, autoValue, isAuto, onAutoToggle, icon: Icon, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          {tooltip && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="relative"
            >
              <Info className="w-3 h-3" style={{ color: 'var(--text-quaternary)' }} />
              {showTooltip && (
                <div
                  className="absolute left-5 top-0 z-50 p-2 rounded-lg text-[10px] leading-relaxed max-w-[200px]"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  {tooltip}
                </div>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAutoToggle && (
            <button
              onClick={onAutoToggle}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold transition-colors"
              style={{
                background: isAuto ? 'var(--accent-cyan)' : 'var(--glass-thin)',
                color: isAuto ? '#fff' : 'var(--text-tertiary)',
              }}
            >
              AUTO
            </button>
          )}
          <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {isAuto ? autoValue?.toFixed(1) : value?.toFixed(1)} {unit}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={isAuto ? autoValue || min : value}
        onChange={(e) => {
          if (isAuto && onAutoToggle) onAutoToggle(); // Switch off auto
          onChange(parseFloat(e.target.value));
        }}
        disabled={isAuto}
        className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
        style={{
          background: isAuto
            ? 'var(--glass-thin)'
            : `linear-gradient(to right, var(--accent-cyan) ${((value - min) / (max - min)) * 100}%, var(--glass-regular) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
};

// ── Main AnalysisControls Component ──
const AnalysisControls = ({
  params,
  onParamsChange,
  autoValues,
  giSummary,
  kdeResult,
  vizMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeMethodology, setActiveMethodology] = useState(null); // 'kde' | 'giStar' | null

  const updateParam = useCallback((key, value) => {
    onParamsChange({ ...params, [key]: value });
  }, [params, onParamsChange]);

  const toggleAuto = useCallback((key) => {
    const autoKey = `${key}Auto`;
    onParamsChange({ ...params, [autoKey]: !params[autoKey] });
  }, [params, onParamsChange]);

  const showKDE    = vizMode === 'kde'     || vizMode === 'all';
  const showGiStar = vizMode === 'hotspot' || vizMode === 'all';

  return (
    <>
      {/* Main controls panel */}
      <div
        className="absolute top-20 left-4 z-[800] rounded-2xl glass-floating overflow-hidden transition-all duration-300"
        style={{ width: '300px' }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 transition-colors"
          style={{ borderBottom: isExpanded ? '1px solid var(--border-default)' : 'none' }}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Analysis Parameters
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          )}
        </button>

        {isExpanded && (
          <div className="p-3 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">

            {/* ── KDE Parameters ── */}
            {showKDE && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-orange)' }} />
                    <span className="text-[11px] font-semibold tracking-wide uppercase"
                      style={{ color: 'var(--accent-orange)' }}>
                      KDE Surface
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveMethodology(activeMethodology === 'kde' ? null : 'kde')}
                    className="p-1 rounded transition-colors"
                    style={{ background: activeMethodology === 'kde' ? 'var(--glass-thick)' : 'transparent' }}
                  >
                    <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>

                {/* Bandwidth slider */}
                <ParamSlider
                  label="Bandwidth"
                  value={params.kdeBandwidth}
                  onChange={(v) => updateParam('kdeBandwidth', v)}
                  min={PARAM_RANGES.bandwidth.min}
                  max={PARAM_RANGES.bandwidth.max}
                  step={PARAM_RANGES.bandwidth.step}
                  unit="km"
                  autoValue={autoValues?.bandwidth}
                  isAuto={params.kdeBandwidthAuto}
                  onAutoToggle={() => toggleAuto('kdeBandwidth')}
                  icon={Ruler}
                  tooltip="Controls smoothness. Silverman's rule calculates optimal value automatically."
                />

                {/* Kernel selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Kernel Function
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {KERNEL_OPTIONS.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => updateParam('kdeKernel', k.id)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                        style={{
                          background: params.kdeKernel === k.id ? 'var(--accent-cyan)' : 'var(--glass-thin)',
                          color: params.kdeKernel === k.id ? '#fff' : 'var(--text-tertiary)',
                          boxShadow: params.kdeKernel === k.id ? '0 0 12px var(--glow-cyan)' : 'none',
                        }}
                        title={k.description}
                      >
                        {k.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] italic" style={{ color: 'var(--text-quaternary)' }}>
                    {KERNEL_OPTIONS.find(k => k.id === params.kdeKernel)?.description}
                  </p>
                </div>

                {/* Resolution slider */}
                <ParamSlider
                  label="Grid Resolution"
                  value={params.kdeResolution}
                  onChange={(v) => updateParam('kdeResolution', v)}
                  min={PARAM_RANGES.resolution.min}
                  max={PARAM_RANGES.resolution.max}
                  step={PARAM_RANGES.resolution.step}
                  unit="cells"
                  autoValue={autoValues?.resolution}
                  isAuto={params.kdeResolutionAuto}
                  onAutoToggle={() => toggleAuto('kdeResolution')}
                  icon={Grid3X3}
                  tooltip="Cells per axis. Higher = finer detail, slower computation."
                />

                {/* KDE Stats summary */}
                {kdeResult && kdeResult.bandwidth > 0 && (
                  <div className="rounded-lg p-2 space-y-1" style={{ background: 'var(--glass-ultra-thin)' }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Computed Values
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                      <span style={{ color: 'var(--text-tertiary)' }}>Bandwidth:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-primary)' }}>
                        {kdeResult.bandwidth.toFixed(2)} km
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Kernel:</span>
                      <span className="font-mono text-right capitalize" style={{ color: 'var(--text-primary)' }}>
                        {kdeResult.kernel}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Grid:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-primary)' }}>
                        {kdeResult.resolution + 1}×{kdeResult.resolution + 1}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>Max density:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-primary)' }}>
                        {kdeResult.maxDensity.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Separator */}
            {showKDE && showGiStar && (
              <div style={{ borderTop: '1px solid var(--border-default)' }} />
            )}

            {/* ── Gi* Parameters ── */}
            {showGiStar && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5" style={{ color: 'var(--accent-purple)' }} />
                    <span className="text-[11px] font-semibold tracking-wide uppercase"
                      style={{ color: 'var(--accent-purple)' }}>
                      Gi* Hotspot
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveMethodology(activeMethodology === 'giStar' ? null : 'giStar')}
                    className="p-1 rounded transition-colors"
                    style={{ background: activeMethodology === 'giStar' ? 'var(--glass-thick)' : 'transparent' }}
                  >
                    <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>

                {/* Distance threshold */}
                <ParamSlider
                  label="Distance Threshold"
                  value={params.giDistanceThreshold}
                  onChange={(v) => updateParam('giDistanceThreshold', v)}
                  min={PARAM_RANGES.distanceThreshold.min}
                  max={PARAM_RANGES.distanceThreshold.max}
                  step={PARAM_RANGES.distanceThreshold.step}
                  unit="km"
                  autoValue={autoValues?.distanceThreshold}
                  isAuto={params.giDistanceThresholdAuto}
                  onAutoToggle={() => toggleAuto('giDistanceThreshold')}
                  icon={Ruler}
                  tooltip="Neighbourhood radius for spatial weights. Auto uses 2.5× avg nearest-neighbour."
                />

                {/* Weight type selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Weight Type
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { id: 'binary', label: 'Binary', desc: 'Equal weight for all neighbours' },
                      { id: 'inverse_distance', label: 'IDW', desc: 'Closer neighbours weighted more' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => updateParam('giWeightType', w.id)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                        style={{
                          background: params.giWeightType === w.id ? 'var(--accent-purple)' : 'var(--glass-thin)',
                          color: params.giWeightType === w.id ? '#fff' : 'var(--text-tertiary)',
                          boxShadow: params.giWeightType === w.id ? '0 0 12px rgba(191,90,242,0.3)' : 'none',
                        }}
                        title={w.desc}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gi* Summary stats */}
                {giSummary && (
                  <div className="rounded-lg p-2 space-y-1.5" style={{ background: 'var(--glass-ultra-thin)' }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                      Results
                    </p>

                    {/* Hotspots */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Flame className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Hotspots
                      </span>
                    </div>
                    <div className="ml-4 grid grid-cols-3 gap-1 text-[9px]">
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(139,0,0,0.3)' }}>
                        <span className="font-mono font-bold text-red-400">{giSummary.hotspots99}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>99%</span>
                      </div>
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(220,38,38,0.2)' }}>
                        <span className="font-mono font-bold text-orange-400">{giSummary.hotspots95}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>95%</span>
                      </div>
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(251,146,60,0.2)' }}>
                        <span className="font-mono font-bold text-yellow-400">{giSummary.hotspots90}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>90%</span>
                      </div>
                    </div>

                    {/* Coldspots */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Snowflake className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Coldspots
                      </span>
                    </div>
                    <div className="ml-4 grid grid-cols-3 gap-1 text-[9px]">
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(30,58,138,0.3)' }}>
                        <span className="font-mono font-bold text-blue-700">{giSummary.coldspots99}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>99%</span>
                      </div>
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(59,130,246,0.2)' }}>
                        <span className="font-mono font-bold text-blue-500">{giSummary.coldspots95}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>95%</span>
                      </div>
                      <div className="text-center rounded py-0.5" style={{ background: 'rgba(147,197,253,0.2)' }}>
                        <span className="font-mono font-bold text-blue-300">{giSummary.coldspots90}</span>
                        <span className="block" style={{ color: 'var(--text-quaternary)' }}>90%</span>
                      </div>
                    </div>

                    {/* Analysis details */}
                    <div className="mt-1.5 pt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]"
                      style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-quaternary)' }}>Points:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                        {giSummary.totalHotspots + giSummary.totalColdspots + giSummary.notSignificant}
                      </span>
                      <span style={{ color: 'var(--text-quaternary)' }}>Dist. threshold:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                        {giSummary.distanceThreshold?.toFixed(2)} km
                      </span>
                      <span style={{ color: 'var(--text-quaternary)' }}>Global X̄:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                        {giSummary.globalMean?.toFixed(3)}
                      </span>
                      <span style={{ color: 'var(--text-quaternary)' }}>Global S:</span>
                      <span className="font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                        {giSummary.globalStdDev?.toFixed(3)}
                      </span>
                      <span style={{ color: 'var(--text-quaternary)' }}>Weights:</span>
                      <span className="font-mono text-right capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {giSummary.weightType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Heatmap note */}
            {vizMode === 'heatmap' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" style={{ color: 'var(--accent-red)' }} />
                  <span className="text-[11px] font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--accent-red)' }}>
                    Client-Side Heatmap
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  Uses leaflet.heat — a GPU-accelerated WebGL renderer that blurs point data into
                  a smooth colour gradient in real-time. No kernel function or bandwidth — purely visual
                  interpolation. For statistically meaningful density, switch to <strong>KDE Surface</strong>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Methodology Popover ── */}
      {activeMethodology && (
        <div
          className="absolute top-20 left-[320px] z-[810] rounded-2xl glass-floating overflow-hidden"
          style={{ width: '320px' }}
        >
          <div className="flex items-center justify-between p-3"
            style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {METHODOLOGY[activeMethodology].title}
              </span>
            </div>
            <button onClick={() => setActiveMethodology(null)} className="p-1 rounded-lg transition-colors"
              style={{ background: 'var(--glass-thin)' }}>
              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>

          <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Formula */}
            <div className="rounded-lg p-2.5" style={{ background: 'var(--glass-ultra-thin)' }}>
              <p className="text-[9px] uppercase font-semibold tracking-wider mb-1"
                style={{ color: 'var(--text-quaternary)' }}>
                Formula
              </p>
              <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--accent-cyan)' }}>
                {METHODOLOGY[activeMethodology].formula}
              </p>
            </div>

            {/* Parameter explanations */}
            {METHODOLOGY[activeMethodology].sections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {sec.param}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {sec.detail}
                </p>
              </div>
            ))}

            {/* Significance table for Gi* */}
            {activeMethodology === 'giStar' && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Significance Thresholds
                </p>
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr style={{ background: 'var(--glass-thin)' }}>
                        <th className="px-2 py-1 text-left" style={{ color: 'var(--text-tertiary)' }}>Level</th>
                        <th className="px-2 py-1 text-right" style={{ color: 'var(--text-tertiary)' }}>Z-Score</th>
                        <th className="px-2 py-1 text-right" style={{ color: 'var(--text-tertiary)' }}>P-Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SIGNIFICANCE_LEVELS).map(([key, val]) => (
                        <tr key={key} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td className="px-2 py-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {val.label.split(' — ').pop()}
                          </td>
                          <td className="px-2 py-1 font-mono text-right" style={{
                            color: val.zThreshold > 0 ? '#ef4444' : '#3b82f6'
                          }}>
                            {val.zThreshold > 0 ? '≥' : '≤'} {val.zThreshold.toFixed(3)}
                          </td>
                          <td className="px-2 py-1 font-mono text-right" style={{ color: 'var(--text-secondary)' }}>
                            {val.pValue.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AnalysisControls;
