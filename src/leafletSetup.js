// leaflet.heat is a UMD plugin that expects a global `L`. In a production
// ESM bundle Leaflet is module-scoped, not global, so the plugin throws
// "L is not defined" (blanking the whole app). Expose Leaflet on window here
// and import THIS module before 'leaflet.heat'.
import L from 'leaflet';

if (typeof window !== 'undefined' && !window.L) {
  window.L = L;
}

export default L;
