import React, { useCallback, useMemo, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { useThemeStore } from '../store/useStore';

/**
 * ProvinceLayer — Interactive Thailand province boundaries
 * 
 * Renders 77 provinces as translucent glass polygons with:
 * - Glowing borders matching the app's accent palette
 * - Smooth hover state (opacity increase + pointer cursor)
 * - Click-to-select with highlighted state
 * - Province name tooltip on hover
 * - Responsive to light/dark theme
 */
const ProvinceLayer = ({ 
  data,               // GeoJSON FeatureCollection with 77 provinces
  selectedProvince,   // Currently selected province name (null = none)
  onProvinceSelect,   // Callback(provinceName | null) when clicked
  visible = true      // Layer visibility toggle
}) => {
  const { theme } = useThemeStore();
  const geoJsonRef = useRef(null);
  const hoveredLayerRef = useRef(null);

  // ── Theme-adaptive colours ──
  const palette = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      // Default state
      fillColor: isDark ? '#10b981' : '#059669',
      fillOpacity: isDark ? 0.06 : 0.04,
      borderColor: isDark ? '#34d399' : '#10b981',
      borderOpacity: isDark ? 0.5 : 0.4,
      borderWeight: 1.2,

      // Hover state
      hoverFillOpacity: isDark ? 0.18 : 0.14,
      hoverBorderColor: isDark ? '#6ee7b7' : '#34d399',
      hoverBorderOpacity: 0.9,
      hoverWeight: 2.5,

      // Selected state
      selectedFillColor: isDark ? '#06b6d4' : '#0891b2',
      selectedFillOpacity: isDark ? 0.22 : 0.18,
      selectedBorderColor: isDark ? '#67e8f9' : '#22d3ee',
      selectedBorderOpacity: 1,
      selectedWeight: 3,

      // Label
      labelBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)',
      labelColor: isDark ? '#e2e8f0' : '#1e293b',
      labelBorder: isDark ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(16,185,129,0.2)',
    };
  }, [theme]);

  // ── Base style for each feature ──
  const style = useCallback((feature) => {
    const name = feature?.properties?.ADM1_EN || '';
    const isSelected = selectedProvince && name === selectedProvince.en;

    if (isSelected) {
      return {
        fillColor: palette.selectedFillColor,
        fillOpacity: palette.selectedFillOpacity,
        color: palette.selectedBorderColor,
        weight: palette.selectedWeight,
        opacity: palette.selectedBorderOpacity,
        className: 'province-selected',
      };
    }

    return {
      fillColor: palette.fillColor,
      fillOpacity: palette.fillOpacity,
      color: palette.borderColor,
      weight: palette.borderWeight,
      opacity: palette.borderOpacity,
    };
  }, [selectedProvince, palette]);

  // ── Event handlers for each feature ──
  const onEachFeature = useCallback((feature, layer) => {
    const props = feature.properties || {};
    const nameEN = props.ADM1_EN || 'Unknown';
    const nameTH = props.ADM1_TH || '';

    // Tooltip with Thai + English name
    const tooltipContent = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 6px 10px;
        border-radius: 10px;
        backdrop-filter: blur(12px);
        background: ${palette.labelBg};
        color: ${palette.labelColor};
        border: ${palette.labelBorder};
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        font-size: 12px;
        line-height: 1.4;
        text-align: center;
      ">
        <div style="font-weight: 700; font-size: 13px;">${nameTH}</div>
        <div style="opacity: 0.7; font-size: 11px; margin-top: 1px;">${nameEN}</div>
      </div>
    `;

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      direction: 'top',
      offset: [0, -8],
      className: 'province-tooltip-container',
    });

    // Hover events
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        const isSelected = selectedProvince && nameEN === selectedProvince.en;

        if (!isSelected) {
          target.setStyle({
            fillOpacity: palette.hoverFillOpacity,
            color: palette.hoverBorderColor,
            weight: palette.hoverWeight,
            opacity: palette.hoverBorderOpacity,
          });
        }

        // Bring to front (but don't mess with selected)
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          target.bringToFront();
        }

        hoveredLayerRef.current = target;

        // Cursor
        const container = e.target._map?.getContainer();
        if (container) container.style.cursor = 'pointer';
      },

      mouseout: (e) => {
        const target = e.target;
        const isSelected = selectedProvince && nameEN === selectedProvince.en;

        if (!isSelected) {
          target.setStyle({
            fillColor: palette.fillColor,
            fillOpacity: palette.fillOpacity,
            color: palette.borderColor,
            weight: palette.borderWeight,
            opacity: palette.borderOpacity,
          });
        }

        hoveredLayerRef.current = null;

        const container = e.target._map?.getContainer();
        if (container) container.style.cursor = '';
      },

      click: (e) => {
        L.DomEvent.stopPropagation(e);

        if (onProvinceSelect) {
          // Toggle: deselect if already selected, else select { en, th }.
          const isSame = selectedProvince && selectedProvince.en === nameEN;
          onProvinceSelect(isSame ? null : { en: nameEN, th: nameTH });
        }
      },
    });
  }, [selectedProvince, onProvinceSelect, palette]);

  // ── Stable key forces GeoJSON re-render when selection/theme changes ──
  const geoJsonKey = useMemo(
    () => `provinces-${theme}-${selectedProvince?.en || 'none'}`,
    [theme, selectedProvince]
  );

  if (!visible || !data?.features?.length) return null;

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={geoJsonKey}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
};

export default React.memo(ProvinceLayer);
