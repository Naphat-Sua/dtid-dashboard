import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ── Vendor chunk mapping for code-splitting ──────────────────
const VENDOR_CHUNKS = {
  'vendor-react': ['react', 'react-dom'],
  // NOTE: leaflet.heat is deliberately NOT chunked here. It is a UMD plugin
  // that needs a global `L`; keeping it out of the eagerly-loadable vendor-map
  // chunk lets it bundle with (lazy) CrimeMap, evaluating only after
  // src/leafletSetup.js has set window.L at app entry.
  'vendor-map': ['leaflet', 'react-leaflet'],
  'vendor-d3': ['d3'],  // matches d3, d3-array, d3-force, etc.
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'vendor-state': ['zustand'],
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // rolldown-vite requires manualChunks as a function
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          for (const [chunkName, packages] of Object.entries(VENDOR_CHUNKS)) {
            if (packages.some(pkg => {
              // Match node_modules/pkg/ or node_modules/.pnpm/pkg
              // For d3, also match d3-* sub-packages
              const re = new RegExp(`node_modules[/\\\\](\\.pnpm[/\\\\])?${pkg.replace('/', '[/\\\\]')}([/\\\\@-]|$)`);
              return re.test(id);
            })) {
              return chunkName;
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
})
