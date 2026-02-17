import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useThemeStore } from '../store/useStore';

/**
 * PoliceStationLayer — Interactive police stations + Voronoi jurisdictions
 *
 * Renders 1,500+ Thai police stations as small glowing blue dots.
 * Jurisdictions (Voronoi polygons clipped to Thailand) are invisible
 * by default and revealed only when the user hovers or clicks a station.
 *
 * Architecture:
 *   - Stations rendered as a raw Leaflet LayerGroup of L.circleMarker
 *     (avoids 1,500+ React components — pure imperative Leaflet for perf)
 *   - Tooltips bound natively via marker.bindTooltip (always works)
 *   - Jurisdictions rendered as a single React GeoJSON layer with
 *     per-feature styling controlled via the effectiveId state
 *   - Hover → enlarged dot + translucent fill on jurisdiction polygon
 *   - Click → locks the highlight; click again or map-click to dismiss
 */
const PoliceStationLayer = ({
  stationData,         // GeoJSON FeatureCollection (points)
  jurisdictionData,    // GeoJSON FeatureCollection (polygons)
  visible = true,      // Master visibility toggle
}) => {
  const { theme } = useThemeStore();
  const map = useMap();

  // Use refs for hover/lock state — avoids re-rendering 1,500 markers
  const activeIdRef = useRef(null);
  const lockedIdRef = useRef(null);
  const markerMapRef = useRef({}); // station_id → L.circleMarker
  const stationLayerGroupRef = useRef(null);

  // Only this state drives the jurisdiction GeoJSON re-key
  const [effectiveId, setEffectiveId] = useState(null);

  // ── Theme palette ──
  const isDark = theme === 'dark';
  const palette = useMemo(() => ({
    dotFill: isDark ? '#3b82f6' : '#2563eb',
    dotRadius: 5,
    dotBorder: isDark ? '#93c5fd' : '#60a5fa',
    dotWeight: 1.5,

    activeDotFill: '#06b6d4',
    activeDotRadius: 8,
    activeDotBorder: '#67e8f9',
    activeDotWeight: 2.5,

    jurisdictionFill: isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.12)',
    jurisdictionBorder: isDark ? '#38bdf8' : '#0284c7',
    jurisdictionWeight: 1.8,
    jurisdictionOpacity: isDark ? 0.85 : 0.75,

    tooltipBg: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
    tooltipColor: isDark ? '#e2e8f0' : '#1e293b',
    tooltipBorder: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(37,99,235,0.2)',
  }), [isDark]);

  // Helpers — imperative dot style changes (no React re-render)
  const setDotActive = useCallback((marker) => {
    marker.setRadius(palette.activeDotRadius);
    marker.setStyle({
      fillColor: palette.activeDotFill,
      color: palette.activeDotBorder,
      weight: palette.activeDotWeight,
    });
  }, [palette]);

  const setDotDefault = useCallback((marker) => {
    marker.setRadius(palette.dotRadius);
    marker.setStyle({
      fillColor: palette.dotFill,
      color: palette.dotBorder,
      weight: palette.dotWeight,
    });
  }, [palette]);

  // ── Build station dots as imperative Leaflet layer group ──
  useEffect(() => {
    if (!map || !visible) return;

    const stations = stationData?.features;
    if (!stations?.length) return;

    // Clean up previous
    if (stationLayerGroupRef.current) {
      map.removeLayer(stationLayerGroupRef.current);
      stationLayerGroupRef.current = null;
    }

    const group = L.layerGroup();
    const markers = {};

    stations.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const props = feature.properties || {};
      const stationId = props.id;
      const name = props.name || 'Police Station';
      const nameTh = props.name_th || '';

      const marker = L.circleMarker([lat, lng], {
        radius: palette.dotRadius,
        fillColor: palette.dotFill,
        fillOpacity: 1,
        color: palette.dotBorder,
        weight: palette.dotWeight,
        opacity: 1,
      });

      // ── Native Leaflet tooltip — works reliably on hover ──
      const tooltipHtml = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 8px 12px;
          border-radius: 12px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: ${palette.tooltipBg};
          color: ${palette.tooltipColor};
          border: 1px solid ${palette.tooltipBorder};
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          font-size: 12px;
          line-height: 1.5;
          min-width: 140px;
          pointer-events: none;
        ">
          ${nameTh ? `<div style="font-weight:700;font-size:13px;">${nameTh}</div>` : ''}
          <div style="
            font-weight: ${nameTh ? 400 : 700};
            opacity: ${nameTh ? 0.75 : 1};
            font-size: ${nameTh ? '11px' : '13px'};
            ${nameTh ? 'margin-top:2px;' : ''}
          ">${name}</div>
          ${props.station_type && props.station_type !== 'police'
            ? `<div style="margin-top:4px;font-size:10px;opacity:0.6;text-transform:capitalize;">${props.station_type}</div>`
            : ''
          }
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -8],
        className: 'police-tooltip-container',
      });

      // ── Hover — imperative style, no React state for dots ──
      marker.on('mouseover', () => {
        if (lockedIdRef.current) return;
        activeIdRef.current = stationId;
        setDotActive(marker);
        setEffectiveId(stationId); // triggers jurisdiction GeoJSON only
      });

      marker.on('mouseout', () => {
        if (lockedIdRef.current) return;
        activeIdRef.current = null;
        setDotDefault(marker);
        setEffectiveId(null);
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);

        if (lockedIdRef.current === stationId) {
          // Un-lock
          lockedIdRef.current = null;
          activeIdRef.current = null;
          setDotDefault(marker);
          setEffectiveId(null);
        } else {
          // Reset previous locked dot
          if (lockedIdRef.current && markers[lockedIdRef.current]) {
            setDotDefault(markers[lockedIdRef.current]);
          }
          // Lock this one
          lockedIdRef.current = stationId;
          activeIdRef.current = stationId;
          setDotActive(marker);
          setEffectiveId(stationId);
        }
      });

      markers[stationId] = marker;
      group.addLayer(marker);
    });

    group.addTo(map);
    stationLayerGroupRef.current = group;
    markerMapRef.current = markers;

    // Clear lock on map click
    const onMapClick = () => {
      if (lockedIdRef.current && markers[lockedIdRef.current]) {
        setDotDefault(markers[lockedIdRef.current]);
      }
      lockedIdRef.current = null;
      activeIdRef.current = null;
      setEffectiveId(null);
    };
    map.on('click', onMapClick);

    return () => {
      map.off('click', onMapClick);
      if (stationLayerGroupRef.current) {
        map.removeLayer(stationLayerGroupRef.current);
        stationLayerGroupRef.current = null;
      }
      markerMapRef.current = {};
    };
  }, [map, stationData, visible, palette, setDotActive, setDotDefault]);

  // ── Remove layer group when hidden ──
  useEffect(() => {
    if (!visible && stationLayerGroupRef.current && map) {
      map.removeLayer(stationLayerGroupRef.current);
      stationLayerGroupRef.current = null;
    }
  }, [visible, map]);

  // ── Jurisdiction polygon style — all invisible unless active ──
  const jurisdictionStyle = useCallback(
    (feature) => {
      const stationId = feature?.properties?.station_id;
      const isActive = stationId != null && stationId === effectiveId;

      if (isActive) {
        return {
          fillColor: palette.jurisdictionFill,
          fillOpacity: 1,
          color: palette.jurisdictionBorder,
          weight: palette.jurisdictionWeight,
          opacity: palette.jurisdictionOpacity,
          dashArray: '6 3',
        };
      }

      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        opacity: 0,
      };
    },
    [effectiveId, palette],
  );

  const geoKey = useMemo(
    () => `jurisdictions-${theme}-${effectiveId ?? 'none'}`,
    [theme, effectiveId],
  );

  if (!visible) return null;

  const hasJurisdictions = jurisdictionData?.features?.length > 0;

  // Only the jurisdiction GeoJSON is React-managed; station dots are pure Leaflet
  return (
    <>
      {hasJurisdictions && (
        <GeoJSON
          key={geoKey}
          data={jurisdictionData}
          style={jurisdictionStyle}
          onEachFeature={(feature, layer) => {
            layer.on({
              mouseover: () => {
                if (!lockedIdRef.current) {
                  activeIdRef.current = feature.properties?.station_id;
                  setEffectiveId(feature.properties?.station_id);
                }
              },
              mouseout: () => {
                if (!lockedIdRef.current) {
                  activeIdRef.current = null;
                  setEffectiveId(null);
                }
              },
            });
          }}
        />
      )}
    </>
  );
};

export default React.memo(PoliceStationLayer);
