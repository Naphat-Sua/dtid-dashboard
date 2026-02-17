-- ============================================================
-- Drug Trafficker Investigation Dashboard (DTID)
-- PostgreSQL + PostGIS Schema
-- Version 2.0 — Spatial-first
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1. Core Tables
-- ============================================================

-- 1.1 PERSON
CREATE TABLE IF NOT EXISTS person (
    person_id       SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    alias           VARCHAR(255),
    national_id     VARCHAR(13) UNIQUE,
    date_of_birth   DATE,
    gender          CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
    home_address    VARCHAR(255),
    current_address VARCHAR(255),
    photo_url       TEXT,
    risk_level      VARCHAR(10) NOT NULL DEFAULT 'Low'
                    CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    status          VARCHAR(20) NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Arrested', 'Released', 'Deceased', 'Unknown', 'Suspect')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_person_name   ON person (first_name, last_name);
CREATE INDEX idx_person_risk   ON person (risk_level);
CREATE INDEX idx_person_status ON person (status);

-- 1.2 LOCATION — Spatial-first with PostGIS geometry
CREATE TABLE IF NOT EXISTS location (
    location_id     SERIAL PRIMARY KEY,
    address_detail  VARCHAR(255) NOT NULL,
    geom            GEOMETRY(Point, 4326) NOT NULL,       -- PostGIS spatial column
    latitude        DOUBLE PRECISION GENERATED ALWAYS AS (ST_Y(geom)) STORED,
    longitude       DOUBLE PRECISION GENERATED ALWAYS AS (ST_X(geom)) STORED,
    location_type   VARCHAR(50) CHECK (location_type IN ('Home', 'CrimeScene', 'DropPoint', 'Warehouse', 'Checkpoint', 'Other')),
    province        VARCHAR(100),
    district        VARCHAR(100),
    sub_district    VARCHAR(100),
    postal_code     VARCHAR(10),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_geom     ON location USING GIST (geom);
CREATE INDEX idx_location_type     ON location (location_type);
CREATE INDEX idx_location_province ON location (province);

-- 1.3 CASE (incident)
CREATE TABLE IF NOT EXISTS incident (
    case_id          SERIAL PRIMARY KEY,
    case_number      VARCHAR(50) UNIQUE,
    case_type        VARCHAR(100) NOT NULL,
    arrest_date      TIMESTAMPTZ,
    location_id      INT REFERENCES location(location_id) ON DELETE SET NULL,
    status           VARCHAR(50) NOT NULL DEFAULT 'Under Investigation',
    description      TEXT,
    officer_in_charge VARCHAR(100),
    court_case_number VARCHAR(50),
    verdict          TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incident_number ON incident (case_number);
CREATE INDEX idx_incident_type   ON incident (case_type);
CREATE INDEX idx_incident_status ON incident (status);
CREATE INDEX idx_incident_date   ON incident (arrest_date);

-- 1.4 DRUG_SEIZURE
CREATE TABLE IF NOT EXISTS drug_seizure (
    seizure_id       SERIAL PRIMARY KEY,
    case_id          INT NOT NULL REFERENCES incident(case_id) ON DELETE CASCADE,
    drug_type        VARCHAR(100) NOT NULL,
    quantity         NUMERIC(15,4) NOT NULL,
    unit             VARCHAR(50) NOT NULL,
    estimated_value  NUMERIC(15,2),
    storage_location VARCHAR(255),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seizure_case ON drug_seizure (case_id);
CREATE INDEX idx_seizure_drug ON drug_seizure (drug_type);

-- ============================================================
-- 2. Junction / Relationship Tables
-- ============================================================

-- 2.1 CASE_PERSON (M:N)
CREATE TABLE IF NOT EXISTS case_person (
    case_person_id      SERIAL PRIMARY KEY,
    case_id             INT NOT NULL REFERENCES incident(case_id) ON DELETE CASCADE,
    person_id           INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    role                VARCHAR(50) NOT NULL,
    involvement_details TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (case_id, person_id, role)
);

CREATE INDEX idx_case_person ON case_person (case_id, person_id);

-- 2.2 PERSON_LOCATION (M:N)
CREATE TABLE IF NOT EXISTS person_location (
    person_location_id  SERIAL PRIMARY KEY,
    person_id           INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    location_id         INT NOT NULL REFERENCES location(location_id) ON DELETE CASCADE,
    location_role       VARCHAR(50) NOT NULL DEFAULT 'Home',
    is_primary          BOOLEAN DEFAULT FALSE,
    start_date          DATE,
    end_date            DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_person_loc ON person_location (person_id, location_id);

-- 2.3 PERSON_CONTACT
CREATE TABLE IF NOT EXISTS person_contact (
    contact_id     SERIAL PRIMARY KEY,
    person_id      INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    contact_type   VARCHAR(50) NOT NULL,
    contact_value  VARCHAR(100),
    is_active      BOOLEAN DEFAULT TRUE,
    notes          VARCHAR(255),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_person ON person_contact (person_id);

-- 2.4 PERSON_RELATIONSHIP — Network Graph edges
CREATE TABLE IF NOT EXISTS person_relationship (
    relationship_id   SERIAL PRIMARY KEY,
    person1_id        INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    person2_id        INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
    relationship_type VARCHAR(100) NOT NULL,
    strength          VARCHAR(10) DEFAULT 'Medium' CHECK (strength IN ('Weak', 'Medium', 'Strong')),
    evidence          TEXT,
    start_date        DATE,
    end_date          DATE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    CHECK (person1_id <> person2_id)
);

CREATE INDEX idx_rel_persons ON person_relationship (person1_id, person2_id);
CREATE INDEX idx_rel_type    ON person_relationship (relationship_type);

-- ============================================================
-- 3. Lookup Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS drug_type_ref (
    drug_type_id  SERIAL PRIMARY KEY,
    drug_name     VARCHAR(100) NOT NULL UNIQUE,
    drug_name_th  VARCHAR(100),
    category      VARCHAR(50),
    description   TEXT
);

INSERT INTO drug_type_ref (drug_name, drug_name_th, category) VALUES
    ('Methamphetamine', 'ยาบ้า/ยาไอซ์', 'ประเภท 1'),
    ('Heroin',          'เฮโรอีน',       'ประเภท 1'),
    ('Cannabis',        'กัญชา',         'ประเภท 5'),
    ('Cocaine',         'โคเคน',         'ประเภท 2'),
    ('Ecstasy',         'ยาอี/เอ็กซ์ตาซี', 'ประเภท 1'),
    ('Ketamine',        'เคตามีน',       'ประเภท 2'),
    ('Crystal Meth',    'ยาไอซ์',        'ประเภท 1'),
    ('Kratom',          'กระท่อม',       'ประเภท 5')
ON CONFLICT (drug_name) DO NOTHING;

-- ============================================================
-- 4. Useful Views
-- ============================================================

CREATE OR REPLACE VIEW vw_case_with_location AS
SELECT
    i.case_id, i.case_number, i.case_type, i.arrest_date, i.status,
    i.description, i.officer_in_charge,
    l.location_id, l.address_detail,
    ST_Y(l.geom) AS latitude, ST_X(l.geom) AS longitude,
    l.location_type, l.province, l.district
FROM incident i
LEFT JOIN location l ON i.location_id = l.location_id;

CREATE OR REPLACE VIEW vw_person_summary AS
SELECT
    p.person_id, p.first_name, p.last_name, p.alias,
    p.risk_level, p.status,
    COUNT(cp.case_id) AS total_cases
FROM person p
LEFT JOIN case_person cp ON p.person_id = cp.person_id
GROUP BY p.person_id;

-- ============================================================
-- 5. Helper Functions
-- ============================================================

-- Find all locations within a radius (km) of a point
CREATE OR REPLACE FUNCTION fn_locations_within_radius(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km DOUBLE PRECISION
)
RETURNS TABLE (
    location_id INT,
    address_detail VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    province VARCHAR,
    distance_km DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.location_id,
        l.address_detail,
        ST_Y(l.geom)::DOUBLE PRECISION,
        ST_X(l.geom)::DOUBLE PRECISION,
        l.province,
        (ST_DistanceSphere(l.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)) / 1000)::DOUBLE PRECISION AS distance_km
    FROM location l
    WHERE ST_DWithin(
        l.geom::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_updated   BEFORE UPDATE ON person   FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_location_updated BEFORE UPDATE ON location FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_incident_updated BEFORE UPDATE ON incident FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
