"""
Append the 184-case demo workbook to the LOCAL demo dataset (src/data/mockData.js)
and write the matching files for a database import. Additive only: existing
records in mockData.js are never edited or removed.

    python3 scripts/appendDemoXlsx.py server/demo-data/DTID_demo_184_cases.xlsx

Outputs
  src/data/mockData.js                 new records inserted before each array's closing `];`
  server/demo-data/cases_184_import.csv   for Admin > Import Cases from CSV (POST /api/upload/csv)
  server/demo-data/related_184.sql        persons, homes, seizures, case links, relationships
                                          (INSERT only, joined on case_number / national_id)

Value mapping (workbook → system enums in src/constants/enums.js):
  person status  Wanted → Suspect, Surveillance → Active (original value kept in Notes)
  gender         ชาย → M, หญิง → F
  relationship   Courier → Courier-Handler
  drug_type      ยาบ้า → Methamphetamine, ไอซ์ → Crystal Meth, ยาอี → Ecstasy, เคตามีน → Ketamine
  unit           เม็ด → pills, ก. → g, กก. → kg
"""
import csv
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
MOCK = ROOT / 'src' / 'data' / 'mockData.js'
OUT = ROOT / 'server' / 'demo-data'
MARKER = 'DEMO DATASET 184 CASES'
ID_BASE = 1001  # above every existing mockData id (max 320)

PERSON_STATUS = {'Arrested': 'Arrested', 'Suspect': 'Suspect', 'Wanted': 'Suspect', 'Surveillance': 'Active'}
GENDER = {'ชาย': 'M', 'หญิง': 'F'}
REL_TYPE = {'Boss-Subordinate': 'Boss-Subordinate', 'Business Partner': 'Business Partner', 'Financial': 'Financial', 'Courier': 'Courier-Handler'}
DRUG = {'ยาบ้า': 'Methamphetamine', 'ไอซ์': 'Crystal Meth', 'ยาอี': 'Ecstasy', 'เคตามีน': 'Ketamine'}
UNIT = {'เม็ด': 'pills', 'ก.': 'g', 'กก.': 'kg'}
NETWORK = {'ก': 'เครือข่าย ก', 'ข': 'เครือข่าย ข', 'ร่วม': 'เชื่อมเครือข่าย ก-ข', 'ทั่วไป': 'ไม่สังกัดเครือข่าย'}
CASE_TYPES = {'Possession', 'Trafficking', 'Distribution', 'Manufacturing', 'Import', 'Export', 'Conspiracy', 'Other'}
CASE_STATUSES = {'Under Investigation', 'Pending', 'Filed', 'Court', 'Adjudicated', 'Closed', 'Appealed'}
LOCATION_TYPES = {'Home', 'CrimeScene', 'DropPoint', 'Warehouse', 'Checkpoint', 'Other'}
RISK = {'Low', 'Medium', 'High', 'Critical'}
ROLES = {'Main Suspect', 'Accomplice', 'Courier', 'Mastermind'}
STRENGTH = {'Weak', 'Medium', 'Strong'}


def sheet(wb, name):
    rows = wb[name].iter_rows(values_only=True)
    header = next(rows)
    return [dict(zip(header, r)) for r in rows if any(v is not None for v in r)]


def num(v):
    return int(v) if float(v).is_integer() else float(v)


def address(sub, district, province):
    if province == 'กรุงเทพมหานคร':
        return f'แขวง{sub} เขต{district} กรุงเทพมหานคร (ที่อยู่สมมุติ)'
    return f'ต.{sub} อ.{district} จ.{province} (ที่อยู่สมมุติ)'


def check(cond, msg):
    if not cond:
        sys.exit(f'ERROR: {msg}')


def main(xlsx):
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    cases = sheet(wb, '01_cases_import')
    persons = sheet(wb, '02_persons')
    links = sheet(wb, '03_case_person')
    seizures = sheet(wb, '04_drug_seizures')
    rels = sheet(wb, '05_relationships')

    src = MOCK.read_text(encoding='utf-8')
    check(MARKER not in src, 'mockData.js already contains the 184-case block — nothing appended')
    used_numbers = set(re.findall(r"CaseNumber: '([^']+)'", src))
    used_nids = set(re.findall(r"NationalID: '(\d+)'", src))

    # ── Validate against the system enums before touching anything ──
    numbers = [c['case_number'] for c in cases]
    check(len(set(numbers)) == len(numbers), 'duplicate case_number in workbook')
    check(not used_numbers & set(numbers), f'case_number already in mockData: {sorted(used_numbers & set(numbers))[:5]}')
    codes = [p['person_code'] for p in persons]
    check(len(set(codes)) == len(codes), 'duplicate person_code')
    check(not used_nids & {p['national_id'] for p in persons}, 'national_id already in mockData')
    for c in cases:
        check(c['case_type'] in CASE_TYPES, f"case_type {c['case_type']}")
        check(c['status'] in CASE_STATUSES, f"status {c['status']}")
        check(c['location_type'] in LOCATION_TYPES, f"location_type {c['location_type']}")
        check(re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(c['arrest_date'])), f"arrest_date {c['arrest_date']}")
    for p in persons:
        check(p['status'] in PERSON_STATUS and p['gender'] in GENDER and p['risk_level'] in RISK, f"person {p['person_code']}")
    for x in links:
        check(x['case_number'] in numbers and x['person_code'] in codes and x['role'] in ROLES, f'case_person {x}')
    for s in seizures:
        check(s['case_number'] in numbers and s['drug_type'] in DRUG and s['unit'] in UNIT, f'seizure {s}')
    for r in rels:
        check(r['person_a'] in codes and r['person_b'] in codes and r['person_a'] != r['person_b'], f'relationship {r}')
        check(r['relationship_type'] in REL_TYPE and r['strength'] in STRENGTH, f'relationship {r}')

    # ── Build mockData records ──
    case_id = {n: ID_BASE + i for i, n in enumerate(numbers)}
    person_id = {code: ID_BASE + i for i, code in enumerate(codes)}
    home_loc = {code: ID_BASE + len(cases) + i for i, code in enumerate(codes)}

    m_locations, m_cases = [], []
    for c in cases:
        cid = case_id[c['case_number']]
        m_locations.append({
            'LocationID': cid, 'AddressDetail': c['address_detail'], 'Latitude': num(c['latitude']), 'Longitude': num(c['longitude']),
            'LocationType': c['location_type'], 'Province': c['province'], 'District': c['district'],
            'SubDistrict': c['sub_district'], 'PostalCode': None,
        })
        m_cases.append({
            'CaseID': cid, 'CaseNumber': c['case_number'], 'CaseType': c['case_type'], 'ArrestDate': f"{c['arrest_date']}T00:00:00",
            'LocationID': cid, 'Status': c['status'], 'Description': c['description'], 'OfficerInCharge': c['officer_in_charge'],
            'CourtCaseNumber': None, 'Verdict': None,
        })
    m_persons, m_person_locations = [], []
    for p in persons:
        pid, lid = person_id[p['person_code']], home_loc[p['person_code']]
        addr = address(p['home_sub_district'], p['home_district'], p['home_province'])
        note = f"[{p['person_code']}] {NETWORK.get(p['network'], p['network'])}: {p['role_in_network']} อายุ {p['age']} ปี"
        if PERSON_STATUS[p['status']] != p['status']:
            note += f" (สถานะในไฟล์ต้นฉบับ: {p['status']})"
        m_persons.append({
            'PersonID': pid, 'FirstName': p['first_name'], 'LastName': p['last_name'], 'Alias': p['nickname'],
            'NationalID': str(p['national_id']), 'DateOfBirth': None, 'Gender': GENDER[p['gender']],
            'HomeAddress': addr, 'CurrentAddress': addr, 'RiskLevel': p['risk_level'], 'Status': PERSON_STATUS[p['status']],
            'Notes': note, 'PhotoURL': f"https://ui-avatars.com/api/?name={p['first_name']}+{p['last_name']}&background=random&size=200",
            'CurrentAddressID': lid,
        })
        m_locations.append({
            'LocationID': lid, 'AddressDetail': addr, 'Latitude': num(p['home_latitude']), 'Longitude': num(p['home_longitude']),
            'LocationType': 'Home', 'Province': p['home_province'], 'District': p['home_district'],
            'SubDistrict': p['home_sub_district'], 'PostalCode': None,
        })
        m_person_locations.append({
            'PersonLocationID': lid, 'PersonID': pid, 'LocationID': lid, 'LocationRole': 'Home',
            'IsPrimary': True, 'StartDate': None, 'EndDate': None,
        })
    m_seizures = [{
        'SeizureID': ID_BASE + i, 'CaseID': case_id[s['case_number']], 'DrugType': DRUG[s['drug_type']], 'Quantity': num(s['quantity']),
        'Unit': UNIT[s['unit']], 'EstimatedValue': num(s['estimated_value_baht']), 'StorageLocation': None, 'Notes': None,
    } for i, s in enumerate(seizures)]
    m_links = [{
        'CasePersonID': ID_BASE + i, 'CaseID': case_id[x['case_number']], 'PersonID': person_id[x['person_code']],
        'Role': x['role'], 'InvolvementDetails': None,
    } for i, x in enumerate(links)]
    m_rels = [{
        'RelationshipID': ID_BASE + i, 'Person1ID': person_id[r['person_a']], 'Person2ID': person_id[r['person_b']],
        'RelationshipType': REL_TYPE[r['relationship_type']], 'Strength': r['strength'], 'Evidence': r['evidence'],
    } for i, r in enumerate(rels)]

    # ── Insert into mockData.js before each array's closing `];` ──
    def js(obj):
        def val(v):
            if v is None:
                return 'null'
            if isinstance(v, bool):
                return 'true' if v else 'false'
            if isinstance(v, (int, float)):
                return repr(v)
            return "'" + str(v).replace('\\', '\\\\').replace("'", "\\'") + "'"
        return '  { ' + ', '.join(f'{k}: {val(v)}' for k, v in obj.items()) + ' }'

    blocks = {'persons': m_persons, 'cases': m_cases, 'locations': m_locations, 'drugSeizures': m_seizures,
              'casePersons': m_links, 'relationships': m_rels, 'personLocations': m_person_locations}
    lines = src.split('\n')
    for name, records in blocks.items():
        start = lines.index(f'export const {name} = [')
        end = next(i for i in range(start, len(lines)) if lines[i] == '];')
        # The previous last element needs a trailing comma before new entries follow.
        last = end - 1
        while not lines[last].strip():
            last -= 1
        if not lines[last].rstrip().endswith(','):
            lines[last] = lines[last].rstrip() + ','
        insert = ['', f'  // {MARKER} (2568–2569) — appended from the demo workbook by scripts/appendDemoXlsx.py. Synthetic data.']
        insert += [js(r) + ',' for r in records]
        insert[-1] = insert[-1].rstrip(',')
        lines[last + 1:last + 1] = insert
    MOCK.write_text('\n'.join(lines), encoding='utf-8')

    # ── Database files (additive) ──
    with open(OUT / 'cases_184_import.csv', 'w', newline='', encoding='utf-8') as f:
        cols = list(cases[0].keys())
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(cases)

    def sql(v):
        if v is None:
            return 'NULL'
        if isinstance(v, bool):
            return 'TRUE' if v else 'FALSE'
        if isinstance(v, (int, float)):
            return repr(v)
        return "'" + str(v).replace("'", "''") + "'"

    def values(rows):
        return ',\n'.join('  (' + ', '.join(sql(v) for v in r) + ')' for r in rows)

    nid = {p['person_code']: str(p['national_id']) for p in persons}
    by_code = {p['person_code']: p for p in persons}
    mp = {r['PersonID']: r for r in m_persons}
    out = [f"""-- ============================================================
-- DTID demo workbook (184 cases) — related records for DB mode
-- Generated by scripts/appendDemoXlsx.py. Synthetic data only.
-- Run AFTER cases_184_import.csv has gone through Import Cases from CSV:
--   psql -U postgres -d dtid_dashboard -f demo-data/related_184.sql
-- INSERT only: nothing is deleted or updated. Rows whose case_number or
-- national_id is missing are skipped, and re-running adds no duplicates.
-- ============================================================
BEGIN;

-- 1. PERSONS ({len(m_persons)})
INSERT INTO person (national_id, first_name, last_name, alias, date_of_birth, gender, home_address, current_address, photo_url, risk_level, status, notes) VALUES
{values([[p['NationalID'], p['FirstName'], p['LastName'], p['Alias'], None, p['Gender'], p['HomeAddress'], p['CurrentAddress'], p['PhotoURL'], p['RiskLevel'], p['Status'], p['Notes']] for p in m_persons])}
ON CONFLICT (national_id) DO NOTHING;

-- 2. HOME LOCATIONS + PERSON_LOCATION ({len(m_persons)})
CREATE TEMP TABLE _home (national_id TEXT, address TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, province TEXT, district TEXT, sub_district TEXT) ON COMMIT DROP;
INSERT INTO _home VALUES
{values([[nid[c], mp[person_id[c]]['HomeAddress'], num(by_code[c]['home_latitude']), num(by_code[c]['home_longitude']), by_code[c]['home_province'], by_code[c]['home_district'], by_code[c]['home_sub_district']] for c in codes])};
DELETE FROM _home h USING person p, person_location pl
  WHERE p.national_id = h.national_id AND pl.person_id = p.person_id AND pl.location_role = 'Home';
DO $$
DECLARE h RECORD; new_loc INT;
BEGIN
  FOR h IN SELECT t.*, p.person_id FROM _home t JOIN person p ON p.national_id = t.national_id LOOP
    INSERT INTO location (address_detail, geom, location_type, province, district, sub_district)
    VALUES (h.address, ST_SetSRID(ST_MakePoint(h.lng, h.lat), 4326), 'Home', h.province, h.district, h.sub_district)
    RETURNING location_id INTO new_loc;
    INSERT INTO person_location (person_id, location_id, location_role, is_primary)
    VALUES (h.person_id, new_loc, 'Home', TRUE);
  END LOOP;
END $$;

-- 3. DRUG SEIZURES ({len(m_seizures)})
INSERT INTO drug_seizure (case_id, drug_type, quantity, unit, estimated_value)
SELECT i.case_id, v.drug_type, v.quantity, v.unit, v.estimated_value
FROM (VALUES
{values([[s['case_number'], DRUG[s['drug_type']], num(s['quantity']), UNIT[s['unit']], num(s['estimated_value_baht']), k] for k, s in enumerate(seizures)])}
) AS v(case_number, drug_type, quantity, unit, estimated_value, ord)
JOIN incident i ON i.case_number = v.case_number
WHERE NOT EXISTS (SELECT 1 FROM drug_seizure d WHERE d.case_id = i.case_id AND d.drug_type = v.drug_type AND d.quantity = v.quantity::numeric AND d.unit = v.unit);

-- 4. CASE ↔ PERSON ({len(m_links)})
INSERT INTO case_person (case_id, person_id, role)
SELECT i.case_id, p.person_id, v.role
FROM (VALUES
{values([[x['case_number'], nid[x['person_code']], x['role']] for x in links])}
) AS v(case_number, national_id, role)
JOIN incident i ON i.case_number = v.case_number
JOIN person p ON p.national_id = v.national_id
ON CONFLICT (case_id, person_id, role) DO NOTHING;

-- 5. RELATIONSHIPS ({len(m_rels)} rows, {len({frozenset((r['person_a'], r['person_b'])) for r in rels})} pairs)
INSERT INTO person_relationship (person1_id, person2_id, relationship_type, strength, evidence)
SELECT p1.person_id, p2.person_id, v.rel_type, v.strength, v.evidence
FROM (VALUES
{values([[nid[r['person_a']], nid[r['person_b']], REL_TYPE[r['relationship_type']], r['strength'], r['evidence']] for r in rels])}
) AS v(nid1, nid2, rel_type, strength, evidence)
JOIN person p1 ON p1.national_id = v.nid1
JOIN person p2 ON p2.national_id = v.nid2
WHERE NOT EXISTS (SELECT 1 FROM person_relationship r WHERE r.person1_id = p1.person_id AND r.person2_id = p2.person_id AND r.relationship_type = v.rel_type);

COMMIT;

SELECT 'incident' AS t, COUNT(*) FROM incident
UNION ALL SELECT 'person', COUNT(*) FROM person
UNION ALL SELECT 'drug_seizure', COUNT(*) FROM drug_seizure
UNION ALL SELECT 'person_relationship', COUNT(*) FROM person_relationship
UNION ALL SELECT 'case_person', COUNT(*) FROM case_person;
"""]
    (OUT / 'related_184.sql').write_text(out[0], encoding='utf-8')
    print(json.dumps({k: len(v) for k, v in blocks.items()}, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else OUT / 'DTID_demo_184_cases.xlsx')
