// ============================================================
// DTID Dashboard — Backend API Server
// PostgreSQL / PostGIS + CSV Upload
// Run: node server/index.js
// ============================================================

import express from 'express';
import cors from 'cors';
import pg from 'pg';
import multer from 'multer';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import compression from 'compression';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(compression());  // gzip all responses (~70% size reduction)
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Request timing header ──────────────────────────────────
app.use((_req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    res.setHeader('X-Response-Time', `${ms}ms`);
    if (ms > 500) console.warn(`⚠️  Slow response: ${_req.method} ${_req.url} — ${ms}ms`);
  });
  next();
});

// ── Simple in-memory cache (TTL-based) ─────────────────────
const cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function cachedQuery(key, queryFn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}
function invalidateCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// Multer — memory storage for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are accepted'), false);
    }
  },
});

// ── PostgreSQL Connection Pool ─────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME     || 'dtid_dashboard',
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('Unexpected PG pool error', err));

// ── Helpers ────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Convert camelCase JS keys → snake_case for DB, and back */
const toSnake = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();
const toCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const rowToCamel = (row) => {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v;
  }
  return out;
};

const rowsToCamel = (rows) => rows.map(rowToCamel);

// ============================================================
// PERSON API
// ============================================================

app.get('/api/persons', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('persons:list');
  if (cached) return res.json(cached);

  const { rows } = await pool.query(`
    SELECT p.*,
           pl.location_id AS current_address_id
    FROM person p
    LEFT JOIN person_location pl
      ON pl.person_id = p.person_id AND pl.is_primary = true
    ORDER BY p.created_at DESC
  `);
  const result = rowsToCamel(rows);
  setCache('persons:list', result);
  res.json(result);
}));

app.get('/api/persons/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM person WHERE person_id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Person not found' });
  res.json(rowToCamel(rows[0]));
}));

app.post('/api/persons', asyncHandler(async (req, res) => {
  const {
    FirstName, LastName, Alias, NationalID, DateOfBirth,
    Gender, HomeAddress, CurrentAddress, RiskLevel, Status, Notes, PhotoURL
  } = req.body;

  const { rows } = await pool.query(`
    INSERT INTO person (first_name, last_name, alias, national_id, date_of_birth,
      gender, home_address, current_address, risk_level, status, notes, photo_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *
  `, [FirstName, LastName, Alias, NationalID, DateOfBirth,
      Gender, HomeAddress, CurrentAddress, RiskLevel || 'Low', Status || 'Active', Notes, PhotoURL]);

  res.status(201).json(rowToCamel(rows[0]));
}));

app.post('/api/persons/complete', asyncHandler(async (req, res) => {
  const { person, contacts, location } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let locationId = null;
    if (location?.Latitude && location?.Longitude) {
      const { rows: [loc] } = await client.query(`
        INSERT INTO location (address_detail, geom, location_type,
          province, district, sub_district, postal_code)
        VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7, $8)
        RETURNING location_id
      `, [location.AddressDetail, location.Latitude, location.Longitude,
          location.LocationType, location.Province, location.District,
          location.SubDistrict, location.PostalCode]);
      locationId = loc.location_id;
    }

    const { rows: [p] } = await client.query(`
      INSERT INTO person (first_name, last_name, alias, national_id, date_of_birth,
        gender, home_address, current_address, risk_level, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [person.FirstName, person.LastName, person.Alias, person.NationalID,
        person.DateOfBirth, person.Gender, person.HomeAddress, person.CurrentAddress,
        person.RiskLevel || 'Low', person.Status || 'Active', person.Notes]);

    if (locationId) {
      await client.query(`
        INSERT INTO person_location (person_id, location_id, location_role, is_primary)
        VALUES ($1, $2, 'Home', true)
      `, [p.person_id, locationId]);
    }

    if (contacts?.length) {
      for (const c of contacts) {
        await client.query(`
          INSERT INTO person_contact (person_id, contact_type, contact_value, is_active, notes)
          VALUES ($1,$2,$3,$4,$5)
        `, [p.person_id, c.ContactType, c.ContactValue, c.IsActive ?? true, c.Notes]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(rowToCamel(p));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

app.put('/api/persons/:id', asyncHandler(async (req, res) => {
  const updates = req.body;
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`${toSnake(key)} = $${idx}`);
    values.push(val);
    idx++;
  }
  values.push(req.params.id);

  await pool.query(`UPDATE person SET ${setClauses.join(', ')} WHERE person_id = $${idx}`, values);
  const { rows } = await pool.query('SELECT * FROM person WHERE person_id = $1', [req.params.id]);
  res.json(rowToCamel(rows[0]));
}));

app.delete('/api/persons/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM person WHERE person_id = $1', [req.params.id]);
  invalidateCache('persons');
  invalidateCache('all');
  res.json({ message: 'Person deleted' });
}));

// Person contacts
app.get('/api/persons/:id/contacts', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM person_contact WHERE person_id = $1', [req.params.id]
  );
  res.json(rowsToCamel(rows));
}));

app.post('/api/persons/:id/contacts', asyncHandler(async (req, res) => {
  const { ContactType, ContactValue, IsActive, Notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO person_contact (person_id, contact_type, contact_value, is_active, notes)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [req.params.id, ContactType, ContactValue, IsActive ?? true, Notes]);
  res.status(201).json(rowToCamel(rows[0]));
}));

// ============================================================
// LOCATION API
// ============================================================

app.get('/api/locations', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('locations:list');
  if (cached) return res.json(cached);

  const { rows } = await pool.query(`
    SELECT location_id, address_detail,
           ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
           location_type, province, district, sub_district, postal_code,
           created_at, updated_at
    FROM location ORDER BY created_at DESC
  `);
  const result = rowsToCamel(rows);
  setCache('locations:list', result);
  res.json(result);
}));

app.get('/api/locations/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT location_id, address_detail,
           ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
           location_type, province, district, sub_district, postal_code
    FROM location WHERE location_id = $1
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Location not found' });
  res.json(rowToCamel(rows[0]));
}));

app.post('/api/locations', asyncHandler(async (req, res) => {
  const { AddressDetail, Latitude, Longitude, LocationType,
          Province, District, SubDistrict, PostalCode } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO location (address_detail, geom, location_type,
      province, district, sub_district, postal_code)
    VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7, $8)
    RETURNING location_id, address_detail,
              ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
              location_type, province, district, sub_district, postal_code
  `, [AddressDetail, Latitude, Longitude, LocationType,
      Province, District, SubDistrict, PostalCode]);
  res.status(201).json(rowToCamel(rows[0]));
}));

app.put('/api/locations/:id', asyncHandler(async (req, res) => {
  const { Latitude, Longitude, ...rest } = req.body;
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(rest)) {
    setClauses.push(`${toSnake(key)} = $${idx}`);
    values.push(val);
    idx++;
  }
  if (Latitude !== undefined && Longitude !== undefined) {
    setClauses.push(`geom = ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)`);
    values.push(Longitude, Latitude);
    idx += 2;
  }
  values.push(req.params.id);

  if (setClauses.length) {
    await pool.query(`UPDATE location SET ${setClauses.join(', ')} WHERE location_id = $${idx}`, values);
  }

  const { rows } = await pool.query(`
    SELECT location_id, address_detail,
           ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
           location_type, province, district, sub_district, postal_code
    FROM location WHERE location_id = $1
  `, [req.params.id]);
  res.json(rowToCamel(rows[0]));
}));

app.delete('/api/locations/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM location WHERE location_id = $1', [req.params.id]);
  res.json({ message: 'Location deleted' });
}));

// Spatial query — locations within radius
app.get('/api/locations/nearby', asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 10 } = req.query;
  const { rows } = await pool.query(`
    SELECT location_id, address_detail,
           ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
           province,
           (ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)) / 1000) AS distance_km
    FROM location
    WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3 * 1000)
    ORDER BY distance_km
  `, [lat, lng, radiusKm]);
  res.json(rowsToCamel(rows));
}));

// ============================================================
// CASE (incident) API
// ============================================================

app.get('/api/cases', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('cases:list');
  if (cached) return res.json(cached);

  const { rows } = await pool.query(`
    SELECT i.*,
           l.address_detail, ST_Y(l.geom) AS latitude, ST_X(l.geom) AS longitude,
           l.province
    FROM incident i
    LEFT JOIN location l ON i.location_id = l.location_id
    ORDER BY i.created_at DESC
  `);
  const result = rowsToCamel(rows);
  setCache('cases:list', result);
  res.json(result);
}));

app.get('/api/cases/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT i.*,
           l.address_detail, ST_Y(l.geom) AS latitude, ST_X(l.geom) AS longitude,
           l.province
    FROM incident i
    LEFT JOIN location l ON i.location_id = l.location_id
    WHERE i.case_id = $1
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Case not found' });
  res.json(rowToCamel(rows[0]));
}));

app.post('/api/cases', asyncHandler(async (req, res) => {
  const {
    CaseNumber, CaseType, ArrestDate, LocationID, Status,
    Description, OfficerInCharge, CourtCaseNumber, Verdict
  } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO incident (case_number, case_type, arrest_date, location_id, status,
      description, officer_in_charge, court_case_number, verdict)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
  `, [CaseNumber, CaseType, ArrestDate, LocationID, Status || 'Under Investigation',
      Description, OfficerInCharge, CourtCaseNumber, Verdict]);
  res.status(201).json(rowToCamel(rows[0]));
}));

app.post('/api/cases/complete', asyncHandler(async (req, res) => {
  const { case: cd, location, involvedPersons, seizures } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let locationId = cd.LocationID;
    if (location?.Latitude && location?.Longitude) {
      const { rows: [loc] } = await client.query(`
        INSERT INTO location (address_detail, geom, location_type,
          province, district, sub_district, postal_code)
        VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7, $8)
        RETURNING location_id
      `, [location.AddressDetail, location.Latitude, location.Longitude,
          location.LocationType || 'CrimeScene', location.Province,
          location.District, location.SubDistrict, location.PostalCode]);
      locationId = loc.location_id;
    }

    const { rows: [inc] } = await client.query(`
      INSERT INTO incident (case_number, case_type, arrest_date, location_id, status,
        description, officer_in_charge, court_case_number, verdict)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [cd.CaseNumber, cd.CaseType, cd.ArrestDate, locationId,
        cd.Status || 'Under Investigation', cd.Description,
        cd.OfficerInCharge, cd.CourtCaseNumber, cd.Verdict]);

    if (involvedPersons?.length) {
      for (const p of involvedPersons) {
        await client.query(`
          INSERT INTO case_person (case_id, person_id, role, involvement_details)
          VALUES ($1,$2,$3,$4)
        `, [inc.case_id, p.personId, p.role, p.details]);
      }
    }

    if (seizures?.length) {
      for (const s of seizures) {
        await client.query(`
          INSERT INTO drug_seizure (case_id, drug_type, quantity, unit,
            estimated_value, storage_location, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [inc.case_id, s.DrugType, s.Quantity, s.Unit,
            s.EstimatedValue, s.StorageLocation, s.Notes]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json(rowToCamel(inc));
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

app.put('/api/cases/:id', asyncHandler(async (req, res) => {
  const updates = req.body;
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`${toSnake(key)} = $${idx}`);
    values.push(val);
    idx++;
  }
  values.push(req.params.id);

  await pool.query(`UPDATE incident SET ${setClauses.join(', ')} WHERE case_id = $${idx}`, values);
  const { rows } = await pool.query('SELECT * FROM incident WHERE case_id = $1', [req.params.id]);
  res.json(rowToCamel(rows[0]));
}));

app.delete('/api/cases/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM incident WHERE case_id = $1', [req.params.id]);
  res.json({ message: 'Case deleted' });
}));

// Case-Person links
app.get('/api/cases/:id/persons', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT p.*, cp.role, cp.involvement_details
    FROM person p
    JOIN case_person cp ON p.person_id = cp.person_id
    WHERE cp.case_id = $1
  `, [req.params.id]);
  res.json(rowsToCamel(rows));
}));

app.post('/api/cases/:id/persons', asyncHandler(async (req, res) => {
  const { personId, role, involvementDetails } = req.body;
  await pool.query(`
    INSERT INTO case_person (case_id, person_id, role, involvement_details)
    VALUES ($1,$2,$3,$4)
  `, [req.params.id, personId, role, involvementDetails]);
  res.status(201).json({ message: 'Person linked to case' });
}));

app.delete('/api/cases/:id/persons/:personId', asyncHandler(async (req, res) => {
  await pool.query(
    'DELETE FROM case_person WHERE case_id = $1 AND person_id = $2',
    [req.params.id, req.params.personId]
  );
  res.json({ message: 'Person removed from case' });
}));

// Seizures per case
app.get('/api/cases/:id/seizures', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM drug_seizure WHERE case_id = $1', [req.params.id]
  );
  res.json(rowsToCamel(rows));
}));

app.post('/api/cases/:id/seizures', asyncHandler(async (req, res) => {
  const { DrugType, Quantity, Unit, EstimatedValue, StorageLocation, Notes } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO drug_seizure (case_id, drug_type, quantity, unit,
      estimated_value, storage_location, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [req.params.id, DrugType, Quantity, Unit, EstimatedValue, StorageLocation, Notes]);
  res.status(201).json(rowToCamel(rows[0]));
}));

// ============================================================
// RELATIONSHIP API
// ============================================================

app.get('/api/relationships', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('relationships:list');
  if (cached) return res.json(cached);

  const { rows } = await pool.query(`
    SELECT pr.*,
           p1.first_name AS person1_first_name, p1.last_name AS person1_last_name,
           p2.first_name AS person2_first_name, p2.last_name AS person2_last_name
    FROM person_relationship pr
    JOIN person p1 ON pr.person1_id = p1.person_id
    JOIN person p2 ON pr.person2_id = p2.person_id
  `);
  const result = rowsToCamel(rows);
  setCache('relationships:list', result);
  res.json(result);
}));

app.post('/api/relationships', asyncHandler(async (req, res) => {
  const { Person1ID, Person2ID, RelationshipType, Strength, Evidence } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO person_relationship (person1_id, person2_id, relationship_type, strength, evidence)
    VALUES ($1,$2,$3,$4,$5) RETURNING *
  `, [Person1ID, Person2ID, RelationshipType, Strength || 'Medium', Evidence]);
  res.status(201).json(rowToCamel(rows[0]));
}));

app.delete('/api/relationships/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM person_relationship WHERE relationship_id = $1', [req.params.id]);
  res.json({ message: 'Relationship deleted' });
}));

// ============================================================
// PERSON_LOCATION API
// ============================================================

app.get('/api/person-locations', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('person-locations:list');
  if (cached) return res.json(cached);

  const { rows } = await pool.query('SELECT * FROM person_location ORDER BY person_id');
  const result = rowsToCamel(rows);
  setCache('person-locations:list', result);
  res.json(result);
}));

app.post('/api/person-locations', asyncHandler(async (req, res) => {
  const { PersonID, LocationID, LocationRole, IsPrimary, StartDate, EndDate } = req.body;
  const { rows } = await pool.query(`
    INSERT INTO person_location (person_id, location_id, location_role, is_primary, start_date, end_date)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
  `, [PersonID, LocationID, LocationRole || 'Home', IsPrimary ?? false, StartDate, EndDate]);
  res.status(201).json(rowToCamel(rows[0]));
}));

// ============================================================
// CONTACT & SEIZURE CRUD (standalone)
// ============================================================

app.put('/api/contacts/:id', asyncHandler(async (req, res) => {
  const updates = req.body;
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`${toSnake(key)} = $${idx}`);
    values.push(val);
    idx++;
  }
  values.push(req.params.id);
  await pool.query(`UPDATE person_contact SET ${setClauses.join(', ')} WHERE contact_id = $${idx}`, values);
  const { rows } = await pool.query('SELECT * FROM person_contact WHERE contact_id = $1', [req.params.id]);
  res.json(rowToCamel(rows[0]));
}));

app.delete('/api/contacts/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM person_contact WHERE contact_id = $1', [req.params.id]);
  res.json({ message: 'Contact deleted' });
}));

app.put('/api/seizures/:id', asyncHandler(async (req, res) => {
  const updates = req.body;
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [key, val] of Object.entries(updates)) {
    setClauses.push(`${toSnake(key)} = $${idx}`);
    values.push(val);
    idx++;
  }
  values.push(req.params.id);
  await pool.query(`UPDATE drug_seizure SET ${setClauses.join(', ')} WHERE seizure_id = $${idx}`, values);
  const { rows } = await pool.query('SELECT * FROM drug_seizure WHERE seizure_id = $1', [req.params.id]);
  res.json(rowToCamel(rows[0]));
}));

app.delete('/api/seizures/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM drug_seizure WHERE seizure_id = $1', [req.params.id]);
  res.json({ message: 'Seizure deleted' });
}));

// ============================================================
// ANALYTICS / STATS
// ============================================================

app.get('/api/stats', asyncHandler(async (_req, res) => {
  const [
    { rows: [total] },
    { rows: [arrested] },
    { rows: [active] },
    { rows: drugStats }
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM person'),
    pool.query("SELECT COUNT(*)::int AS count FROM person WHERE status = 'Arrested'"),
    pool.query("SELECT COUNT(*)::int AS count FROM incident WHERE status = 'Under Investigation'"),
    pool.query(`
      SELECT drug_type, SUM(quantity)::numeric AS total_quantity, unit,
             COUNT(*)::int AS count, SUM(estimated_value)::numeric AS total_value
      FROM drug_seizure GROUP BY drug_type, unit
    `)
  ]);

  res.json({
    totalPersons: total.count,
    totalArrests: arrested.count,
    activeCases: active.count,
    drugStats: rowsToCamel(drugStats)
  });
}));

app.get('/api/analytics/hotspots', asyncHandler(async (req, res) => {
  const { province } = req.query;
  let query = `
    SELECT l.location_id, ST_Y(l.geom) AS latitude, ST_X(l.geom) AS longitude,
           l.province, l.district,
           COUNT(i.case_id)::int AS case_count,
           SUM(CASE WHEN ds.drug_type = 'Methamphetamine' THEN ds.quantity ELSE 0 END)::numeric AS meth_quantity,
           SUM(ds.estimated_value)::numeric AS total_drug_value
    FROM location l
    LEFT JOIN incident i ON l.location_id = i.location_id
    LEFT JOIN drug_seizure ds ON i.case_id = ds.case_id
  `;
  const params = [];
  if (province) {
    query += ' WHERE l.province = $1';
    params.push(province);
  }
  query += `
    GROUP BY l.location_id, l.geom, l.province, l.district
    HAVING COUNT(i.case_id) > 0
    ORDER BY case_count DESC
  `;
  const { rows } = await pool.query(query, params);
  res.json(rowsToCamel(rows));
}));

// ============================================================
// CSV UPLOAD — The big new feature
// ============================================================

/**
 * POST /api/upload/csv
 *
 * Accepts a .csv file with the following columns (case-insensitive headers):
 *   Required: case_number | title, latitude, longitude
 *   Optional: case_type, description, arrest_date | date, status,
 *             officer_in_charge | officer, province, district,
 *             sub_district, address_detail | address, location_type
 *
 * For each row it:
 *   1. Creates a Location (PostGIS point)
 *   2. Creates an Incident linked to that location
 *
 * Returns the array of newly created incidents with their locations.
 */
app.post('/api/upload/csv', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Parse CSV from buffer
  const records = await new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(req.file.buffer.toString('utf-8'));
    stream
      .pipe(csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });

  if (!records.length) {
    return res.status(400).json({ message: 'CSV file is empty' });
  }

  // Validate required columns exist
  const firstRow = records[0];
  const hasTitle = 'case_number' in firstRow || 'title' in firstRow;
  const hasLat   = 'latitude' in firstRow || 'lat' in firstRow;
  const hasLng   = 'longitude' in firstRow || 'lng' in firstRow || 'lon' in firstRow;

  if (!hasTitle || !hasLat || !hasLng) {
    return res.status(400).json({
      message: 'CSV must contain columns: case_number (or title), latitude (or lat), longitude (or lng/lon)',
      receivedColumns: Object.keys(firstRow)
    });
  }

  const client = await pool.connect();
  const inserted = [];
  const errors = [];

  try {
    await client.query('BEGIN');

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const lat = parseFloat(row.latitude || row.lat);
        const lng = parseFloat(row.longitude || row.lng || row.lon);

        if (isNaN(lat) || isNaN(lng)) {
          errors.push({ row: i + 2, message: 'Invalid latitude/longitude' });
          continue;
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          errors.push({ row: i + 2, message: `Coordinates out of range: ${lat}, ${lng}` });
          continue;
        }

        // Create location
        const { rows: [loc] } = await client.query(`
          INSERT INTO location (address_detail, geom, location_type,
            province, district, sub_district, postal_code)
          VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7, $8)
          RETURNING location_id, ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
                    address_detail, province, district
        `, [
          row.address_detail || row.address || `Imported location #${i + 1}`,
          lat, lng,
          row.location_type || 'CrimeScene',
          row.province || null,
          row.district || null,
          row.sub_district || null,
          row.postal_code || null
        ]);

        // Create incident
        const caseNumber = row.case_number || row.title || `CSV-${Date.now()}-${i}`;
        const { rows: [inc] } = await client.query(`
          INSERT INTO incident (case_number, case_type, arrest_date, location_id,
            status, description, officer_in_charge)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING *
        `, [
          caseNumber,
          row.case_type || row.type || 'Imported',
          row.arrest_date || row.date || null,
          loc.location_id,
          row.status || 'Under Investigation',
          row.description || null,
          row.officer_in_charge || row.officer || null
        ]);

        inserted.push({
          ...rowToCamel(inc),
          latitude: loc.latitude,
          longitude: loc.longitude,
          addressDetail: loc.address_detail,
          province: loc.province,
          district: loc.district
        });
      } catch (rowErr) {
        errors.push({ row: i + 2, message: rowErr.message });
      }
    }

    await client.query('COMMIT');

    // Invalidate all caches after bulk import
    cache.clear();

    res.status(201).json({
      message: `Successfully imported ${inserted.length} of ${records.length} records`,
      inserted,
      errors,
      total: records.length,
      successCount: inserted.length,
      errorCount: errors.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ============================================================
// AGGREGATE DATA ENDPOINT — single round-trip for store hydration
// ============================================================

app.get('/api/all', asyncHandler(async (_req, res) => {
  const cached = cachedQuery('all:data');
  if (cached) return res.json(cached);

  const [personsQ, casesQ, locationsQ, relationshipsQ, personLocationsQ] = await Promise.all([
    pool.query(`
      SELECT p.*, pl.location_id AS current_address_id
      FROM person p
      LEFT JOIN person_location pl ON pl.person_id = p.person_id AND pl.is_primary = true
      ORDER BY p.created_at DESC
    `),
    pool.query(`
      SELECT i.*, l.address_detail, ST_Y(l.geom) AS latitude, ST_X(l.geom) AS longitude, l.province
      FROM incident i
      LEFT JOIN location l ON i.location_id = l.location_id
      ORDER BY i.created_at DESC
    `),
    pool.query(`
      SELECT location_id, address_detail, ST_Y(geom) AS latitude, ST_X(geom) AS longitude,
             location_type, province, district, sub_district, postal_code, created_at, updated_at
      FROM location ORDER BY created_at DESC
    `),
    pool.query(`
      SELECT pr.*, p1.first_name AS person1_first_name, p1.last_name AS person1_last_name,
             p2.first_name AS person2_first_name, p2.last_name AS person2_last_name
      FROM person_relationship pr
      JOIN person p1 ON pr.person1_id = p1.person_id
      JOIN person p2 ON pr.person2_id = p2.person_id
    `),
    pool.query('SELECT * FROM person_location ORDER BY person_id'),
  ]);

  const result = {
    persons: rowsToCamel(personsQ.rows),
    cases: rowsToCamel(casesQ.rows),
    locations: rowsToCamel(locationsQ.rows),
    relationships: rowsToCamel(relationshipsQ.rows),
    personLocations: rowsToCamel(personLocationsQ.rows),
  };
  setCache('all:data', result);
  res.json(result);
}));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', asyncHandler(async (_req, res) => {
  try {
    const { rows: [pgInfo] } = await pool.query('SELECT version()');
    let postgisVersion = 'not installed';
    try {
      const { rows: [gis] } = await pool.query('SELECT PostGIS_Version() AS version');
      postgisVersion = gis.version;
    } catch { /* PostGIS not available */ }
    
    res.json({
      status: 'ok',
      database: 'connected',
      postgres: pgInfo.version,
      postgis: postgisVersion,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
  console.log(`\n🚀 DTID Dashboard API Server`);
  console.log(`   http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
