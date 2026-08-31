# DTID Dashboard

**ระบบสารสนเทศภูมิศาสตร์เพื่อการสืบสวนเครือข่ายการค้ายาเสพติด**
*A GIS dashboard for investigating drug‑trafficking networks — prototype study area: สภ.สามพราน จ.นครปฐม (Sam Phran District, Nakhon Pathom).*

DTID (Drug‑Trafficker Investigation Dashboard) combines an interactive crime map,
spatial‑statistics hotspot analysis, criminal‑network link analysis, and a
role‑based case‑management back office into one web application. It ships with a
self‑contained demo dataset so it runs with **no backend required**, and an
optional PostgreSQL/PostGIS API server for real, multi‑user deployments.

---

## Features

- **Crime map (GIS).** Leaflet map with case markers, a KDE heatmap, and a
  Getis‑Ord Gi\* hotspot layer. Filter by province; fly to a suspect's location.
- **Spatial statistics.** Kernel Density Estimation, Getis‑Ord Gi\* (hot/cold
  spots with z‑score & p‑value), **Global Moran's I** (spatial autocorrelation),
  and **Average Nearest Neighbor** (clustered vs. dispersed). All parameters are
  adjustable from the analysis panel.
- **Road‑network corridor analysis (MVP).** Builds a graph from the road layer,
  snaps case/seizure points to the nearest node, and highlights the most‑traversed
  segments as likely trafficking corridors.
- **Criminal‑network analysis.** D3 force‑directed link graph with degree &
  betweenness centrality and a "key persons" score.
- **Case management.** Add people and record cases (with drug seizures, involved
  persons, and a map‑based location picker), plus an admin table to edit/delete.
- **CSV import with auto‑geocoding.** Bulk‑import cases; rows with an address but
  no coordinates are geocoded automatically (OSM Nominatim) before insert.
- **Security & RBAC.** JWT auth (access + refresh), bcrypt password hashing,
  three roles (Viewer / Analyst / Admin), Helmet, CORS allow‑list, rate limiting,
  input validation, and an append‑only audit log of every mutation.

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite (rolldown‑vite), Tailwind CSS 4, Zustand 5, React‑Leaflet 5, D3 7, react‑hook‑form + Zod |
| Backend    | Node.js + Express 4, PostgreSQL + PostGIS, `pg`, Multer, csv‑parser |
| Security   | jsonwebtoken, bcryptjs, helmet, express‑rate‑limit, express‑validator, hpp |
| Tooling    | ESLint 9 (flat config), `node:test` for unit tests |

---

## Quick start (frontend only — no backend)

The app defaults to **LOCAL mode** and renders from a bundled demo dataset, so you
can run the whole UI with just Node:

```bash
npm install
npm run dev        # http://localhost:5173
```

That's enough to explore the map, analysis, network graph, and admin screens.
Changes you make (add person, record case) live in the browser session only.

## Full‑stack setup (with the API server)

Requires **PostgreSQL with the PostGIS extension**.

```bash
# 1. Backend deps
cd server
npm install

# 2. Configure environment
cp .env.example .env        # then edit secrets / DB credentials

# 3. Create schema + demo data + demo users (needs psql on PATH)
npm run db:reset            # db:create → db:schema → db:seed → db:seed:users

# 4. Run the API (default http://localhost:3001)
npm run dev
```

### Demo accounts

Created by `npm run db:seed:users`. **Demonstration credentials only — change them
before any real deployment.**

| Username  | Password      | Role    | Can do |
|-----------|---------------|---------|--------|
| `admin`   | `admin1234`   | Admin   | Full CRUD, CSV import, user management |
| `analyst` | `analyst1234` | Analyst | Spatial + network analysis, all reads |
| `viewer`  | `viewer1234`  | Viewer  | Read‑only |

---

## Data modes

The frontend has two data sources:

- **LOCAL (default).** In‑memory demo data from `src/data/`. No network calls;
  ideal for demos, screenshots, and offline development.
- **SYNC / DB.** Reads and writes go through the API server (`src/services/dbService.js`),
  which attaches the JWT access token and transparently refreshes it on 401.

The demo geography is **synthetic** and set in and around สามพราน — it is not real
case data.

## Project structure

```
src/
  components/        UI: CrimeMap, AnalysisControls, NetworkGraph, SuspectList,
                     StatsPanel, AdminPage, LoginPage, Sidebar, …
    forms/           AddPersonForm, RecordCaseForm (react-hook-form + Zod)
  constants/         enums.js — single source of truth for statuses/types/labels
  data/              mockData.js, demoGISData.js (LOCAL-mode dataset)
  services/          dbService.js (API client, JWT handling)
  store/             useStore.js (Zustand: data store + auth store)
  utils/             spatialAnalysis, roadNetwork, provinceFilter, riskLevels, …
server/
  index.js           Express app + REST routes
  middleware/        security.js (helmet/cors/rate-limit/hpp), auth.js (JWT/RBAC)
  routes/            auth.js (login / refresh / logout / me)
  lib/               audit.js (audit log), geocode.js (Nominatim)
  db/                schema.sql, seed.sql, seedUsers.js
```

## Testing

Unit tests use Node's built‑in test runner (`node:test`) — no extra test
framework is installed.

```bash
npm test             # run all unit tests (frontend utils + backend logic)
npm run test:watch   # watch mode
```

> **Note:** this project uses `rolldown-vite`, which is not compatible with
> Vitest's module runner, so pure logic is tested with `node:test` and UI flows
> are exercised with Playwright.

## Scripts

**Frontend** (root): `dev`, `build`, `preview`, `lint`, `test`, `test:watch`.
**Backend** (`server/`): `start`, `dev`, `db:create`, `db:schema`, `db:seed`,
`db:seed:users`, `db:reset`.

## Notes & caveats

- **PostGIS is required** for the backend (spatial columns/queries). The frontend
  LOCAL mode has no such requirement.
- **Geocoding** uses the public OSM Nominatim service (rate‑limited to ~1 req/s);
  it needs outbound HTTPS and is best‑effort — explicit coordinates always win.
- The bundled dataset is **synthetic demonstration data**, not real investigative
  records.
