// ============================================================
// Generate the expanded synthetic demo dataset (>= 200 cases) for DB mode.
//
//   node scripts/generateDemoDataset.mjs
//
// Output: server/demo-data/
//   cases_import.csv      → upload via Admin › Import Cases from CSV (POST /api/upload/csv)
//   related_data.sql      → persons, person locations, seizures, case-person links and
//                           relationships, joined to the imported cases by case_number
//   persons.csv, person_locations.csv, drug_seizures.csv, case_persons.csv,
//   relationships.csv     → the same records with the mockData column names (reference)
//
// The original 36-case demo (src/data/mockData.js) is carried over unchanged and
// extended with generated cases. A seeded PRNG makes the output reproducible.
// All names, IDs and incidents are synthetic.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as mock from '../src/data/mockData.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'server', 'demo-data');
const tambonGeo = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/geo/tambonSampran.json'), 'utf8'));

const NEW_CASES = 180;
const SEED = 2569;

// ── Seeded PRNG (mulberry32) ────────────────────────────────
let s = SEED >>> 0;
const rand = () => {
  s = (s + 0x6D2B79F5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const chance = (p) => rand() < p;
const weighted = (entries) => {
  const total = entries.reduce((t, [, w]) => t + w, 0);
  if (!(total > 0)) throw new Error('weighted(): invalid weights');
  let r = rand() * total;
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
};
const round = (v, d = 4) => Number(v.toFixed(d));
const pad = (n, w = 2) => String(n).padStart(w, '0');

// ── Geography ───────────────────────────────────────────────
const POSTAL = { 'ไร่ขิง': '73210', 'กระทุ่มล้ม': '73220', 'อ้อมใหญ่': '73160' };
const postalFor = (tambon) => POSTAL[tambon] || '73110';

const tambonPolys = Object.fromEntries(tambonGeo.features.map(f => [
  f.properties.TAMBON_T,
  f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
]));
const inRing = (lng, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inTambon = (tambon, lat, lng) => tambonPolys[tambon].some(poly => inRing(lng, lat, poly[0]));
const randomPointIn = (tambon) => {
  const ring = tambonPolys[tambon].flatMap(p => p[0]);
  const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]);
  for (;;) {
    const lng = Math.min(...xs) + rand() * (Math.max(...xs) - Math.min(...xs));
    const lat = Math.min(...ys) + rand() * (Math.max(...ys) - Math.min(...ys));
    if (inTambon(tambon, lat, lng)) return [round(lat), round(lng)];
  }
};
const tambonOf = (lat, lng) => Object.keys(tambonPolys).find(t => inTambon(t, lat, lng)) || null;

// Activity weight per tambon: urban/Phetkasem corridor high, western farmland low.
const TAMBON_WEIGHT = {
  'อ้อมใหญ่': 10, 'ท่าข้าม': 9, 'ไร่ขิง': 8, 'สามพราน': 7, 'ยายชา': 5, 'กระทุ่มล้ม': 6,
  'บ้านใหม่': 5, 'ท่าตลาด': 4, 'บางกระทึก': 3, 'บางเตย': 3, 'หอมเกร็ด': 2.5, 'ทรงคนอง': 2,
  'คลองใหม่': 2, 'บางช้าง': 2, 'ตลาดจินดา': 1.5, 'คลองจินดา': 1,
};

// Named hot sites in Sam Phran (synthetic points near real landmarks).
const SAMPRAN_POIS = [
  ['ตลาดใหม่อ้อมใหญ่', 13.7001, 100.2641, 'CrimeScene', 6],
  ['หอพักคนงานซอยตลาดใหม่อ้อมใหญ่', 13.7024, 100.2628, 'Home', 5],
  ['ปั๊มน้ำมันถนนเพชรเกษม ช่วงอ้อมใหญ่', 13.6992, 100.2598, 'DropPoint', 4],
  ['จุดตรวจถนนเพชรเกษม ช่วงอ้อมใหญ่', 13.6948, 100.2702, 'Checkpoint', 4],
  ['ตลาดวัดเทียนดัด', 13.6921, 100.2468, 'CrimeScene', 4],
  ['ชุมชนวัดท่าข้าม', 13.7132, 100.2461, 'CrimeScene', 5],
  ['ซอยชุมชนท่าข้ามเหนือ', 13.7158, 100.2449, 'Home', 4],
  ['ตลาดวัดไร่ขิง', 13.7331, 100.2791, 'CrimeScene', 5],
  ['หอพักย่านถนนไร่ขิง', 13.7262, 100.2702, 'Home', 3],
  ['ร้านเกมย่านถนนไร่ขิง', 13.7212, 100.2611, 'DropPoint', 2],
  ['ตลาดเทศบาลสามพราน', 13.7212, 100.2182, 'CrimeScene', 5],
  ['ท่ารถตู้ตลาดสามพราน', 13.7189, 100.2213, 'DropPoint', 3],
  ['ตลาดชุมชนกระทุ่มล้ม', 13.7441, 100.3298, 'CrimeScene', 4],
  ['หอพักย่านพุทธมณฑลสาย 4 ต.กระทุ่มล้ม', 13.7365, 100.3242, 'Home', 3],
  ['ตลาดน้ำดอนหวาย', 13.7659, 100.3066, 'CrimeScene', 2],
  ['ลานจอดรถบรรทุกถนนพุทธมณฑลสาย 5', 13.7268, 100.2856, 'DropPoint', 3],
  ['บ้านเช่าหมู่บ้านจัดสรร ต.ยายชา', 13.7302, 100.2347, 'Home', 3],
  ['โกดังให้เช่า ต.ท่าตลาด', 13.7461, 100.2365, 'Warehouse', 2],
  ['สวนผลไม้ร้าง ต.บางช้าง', 13.6968, 100.2003, 'Warehouse', 1],
  ['ทางหลวง 3316 ช่วงหอมเกร็ด', 13.7705, 100.2338, 'Checkpoint', 2],
].map(([name, lat, lng, type, w]) => {
  const tambon = tambonOf(lat, lng);
  if (!tambon) throw new Error(`POI outside Sam Phran tambons: ${name}`);
  return { name, lat, lng, type, w, tambon };
});

// Out-of-area sites (neighbouring districts/provinces linked to Sam Phran networks).
const OUTSIDE_SITES = [
  { name: 'ตลาดศาลายา', province: 'นครปฐม', district: 'พุทธมณฑล', tambon: 'ศาลายา', postal: '73170', lat: 13.7992, lng: 100.3218, type: 'CrimeScene', w: 1, zone: 'east' },
  { name: 'หอพักย่านศาลายา', province: 'นครปฐม', district: 'พุทธมณฑล', tambon: 'ศาลายา', postal: '73170', lat: 13.7931, lng: 100.3077, type: 'Home', w: 1, zone: 'east' },
  { name: 'ตลาดนครชัยศรี', province: 'นครปฐม', district: 'นครชัยศรี', tambon: 'นครชัยศรี', postal: '73120', lat: 13.8013, lng: 100.1862, type: 'CrimeScene', w: 1, zone: 'west' },
  { name: 'ถนนเพชรเกษม ช่วงนครชัยศรี', province: 'นครปฐม', district: 'นครชัยศรี', tambon: 'ท่าตำหนัก', postal: '73120', lat: 13.7789, lng: 100.1415, type: 'Checkpoint', w: 1, zone: 'west' },
  { name: 'ย่านองค์พระปฐมเจดีย์', province: 'นครปฐม', district: 'เมืองนครปฐม', tambon: 'พระปฐมเจดีย์', postal: '73000', lat: 13.8196, lng: 100.0601, type: 'CrimeScene', w: 1, zone: 'west' },
  { name: 'ชุมชนอ้อมน้อย', province: 'สมุทรสาคร', district: 'กระทุ่มแบน', tambon: 'อ้อมน้อย', postal: '74130', lat: 13.7012, lng: 100.3121, type: 'CrimeScene', w: 1, zone: 'south' },
  { name: 'หอพักคนงานโรงงาน ต.อ้อมน้อย', province: 'สมุทรสาคร', district: 'กระทุ่มแบน', tambon: 'อ้อมน้อย', postal: '74130', lat: 13.6935, lng: 100.3045, type: 'Home', w: 1, zone: 'south' },
  { name: 'ตลาดกระทุ่มแบน', province: 'สมุทรสาคร', district: 'กระทุ่มแบน', tambon: 'ตลาดกระทุ่มแบน', postal: '74110', lat: 13.6531, lng: 100.2589, type: 'CrimeScene', w: 1, zone: 'south' },
  { name: 'ตลาดหนองแขม', province: 'กรุงเทพมหานคร', district: 'หนองแขม', tambon: 'หนองแขม', postal: '10160', lat: 13.7046, lng: 100.3492, type: 'CrimeScene', w: 1, zone: 'east' },
  { name: 'คอนโดย่านทวีวัฒนา', province: 'กรุงเทพมหานคร', district: 'ทวีวัฒนา', tambon: 'ศาลาธรรมสพน์', postal: '10170', lat: 13.7768, lng: 100.3522, type: 'Home', w: 1, zone: 'east' },
  { name: 'ย่านซีคอนบางแค', province: 'กรุงเทพมหานคร', district: 'บางแค', tambon: 'บางแค', postal: '10160', lat: 13.7105, lng: 100.3935, type: 'DropPoint', w: 1, zone: 'east' },
  { name: 'จุดพักรถถนนเพชรเกษม บ้านโป่ง', province: 'ราชบุรี', district: 'บ้านโป่ง', tambon: 'บ้านโป่ง', postal: '70110', lat: 13.8152, lng: 99.8781, type: 'Checkpoint', w: 1, zone: 'west' },
];

// Places persons may live outside Sam Phran (incl. long-haul supply origins).
const OUTSIDE_HOMES = {
  east: [OUTSIDE_SITES[1], OUTSIDE_SITES[9], OUTSIDE_SITES[8]],
  south: [OUTSIDE_SITES[6], OUTSIDE_SITES[5]],
  west: [OUTSIDE_SITES[2], OUTSIDE_SITES[11], OUTSIDE_SITES[4]],
  // Suppliers' current homes stay within ~60 km so the network map still frames Sam Phran.
  supplier: [
    { name: 'บ้านเช่า ต.ท่าผา', province: 'ราชบุรี', district: 'บ้านโป่ง', tambon: 'ท่าผา', postal: '70110', lat: 13.8427, lng: 99.8512, type: 'Home' },
    { name: 'ทาวน์เฮาส์ ต.บางบัวทอง', province: 'นนทบุรี', district: 'บางบัวทอง', tambon: 'บางบัวทอง', postal: '11110', lat: 13.9097, lng: 100.4236, type: 'Home' },
  ],
};

// Sam Phran activity sites = POIs + generated village points per tambon.
const sites = [];
for (const p of SAMPRAN_POIS) {
  sites.push({ ...p, province: 'นครปฐม', district: 'สามพราน', postal: postalFor(p.tambon), zone: 'sampran' });
}
// Village numbers already used by the original demo addresses stay reserved.
const usedMoo = new Set(mock.locations.map(l => /หมู่ (\d+) ต\.(\S+)/.exec(l.AddressDetail)).filter(Boolean).map(m => `${m[2]}-${m[1]}`));
for (const [tambon, w] of Object.entries(TAMBON_WEIGHT)) {
  const n = Math.max(2, Math.round(w * 0.9));
  for (let i = 0; i < n; i++) {
    const [lat, lng] = randomPointIn(tambon);
    let moo = randInt(1, 15);
    while (usedMoo.has(`${tambon}-${moo}`)) moo = randInt(1, 15);
    usedMoo.add(`${tambon}-${moo}`);
    sites.push({
      name: `ชุมชนหมู่ ${moo}`, tambon, lat, lng, province: 'นครปฐม', district: 'สามพราน',
      postal: postalFor(tambon), type: weighted([['CrimeScene', 6], ['Home', 3], ['DropPoint', 1]]),
      w: w / n, zone: 'sampran', moo,
    });
  }
}
for (const o of OUTSIDE_SITES) sites.push({ ...o });

const addressFor = (site, houseNo) => {
  const prefix = site.province === 'กรุงเทพมหานคร'
    ? `แขวง${site.tambon} เขต${site.district} กรุงเทพมหานคร`
    : `ต.${site.tambon} อ.${site.district} จ.${site.province}`;
  const lead = houseNo ? `${houseNo} ` : '';
  if (site.moo) return `${lead}หมู่ ${site.moo} ${prefix}`;
  const name = site.name.replace(` ต.${site.tambon}`, '');
  return `${lead}${name} ${prefix}`;
};

// ── People ──────────────────────────────────────────────────
const M_NAMES = ['กิตติพงษ์', 'ณัฐวุฒิ', 'ธีรศักดิ์', 'พงศกร', 'วีระพงษ์', 'อนุวัฒน์', 'สุรเชษฐ์', 'ชัยวัฒน์', 'ศุภชัย', 'ธนพล',
  'อภิชาติ', 'จักรพันธ์', 'ปฏิภาณ', 'วรวุฒิ', 'สิทธิชัย', 'ณรงค์ศักดิ์', 'เอกชัย', 'ภานุวัฒน์', 'ทวีศักดิ์', 'กฤษดา',
  'อดิศร', 'ธวัชชัย', 'วิทยา', 'สมพงษ์', 'บุญเลิศ', 'ประยุทธ', 'สุทธิพงษ์', 'ชาตรี', 'อำนาจ', 'ไพโรจน์',
  'เกียรติศักดิ์', 'นพดล', 'รัฐพล', 'ศักดิ์ชัย', 'ยุทธนา', 'ธนวัฒน์', 'จิรวัฒน์', 'พีรพล', 'คมสัน', 'อนันต์',
  'สมบัติ', 'มานพ', 'วัชระ', 'สุริยา', 'ภูมินทร์', 'ศราวุธ', 'ปิยพงษ์', 'ชนาธิป', 'วุฒิชัย', 'ณัฐพงษ์'];
const F_NAMES = ['สุนิสา', 'พรทิพย์', 'วราภรณ์', 'จันทร์เพ็ญ', 'กาญจนา', 'ศิริพร', 'อรุณี', 'นันทนา', 'ปวีณา', 'รุ่งนภา',
  'ธิดารัตน์', 'สายสุนีย์', 'วิไลวรรณ', 'อัญชลี', 'มณีรัตน์', 'ชุติมา', 'ณัฐธิดา', 'พิมพ์ชนก'];
const LAST_NAMES = ['ศรีสุข', 'บุญมา', 'แก้วประเสริฐ', 'ทองดี', 'พรหมมา', 'สายบุญ', 'จันทร์หอม', 'มีสุข', 'อินทร์แก้ว', 'วงษ์สวัสดิ์',
  'ชัยมงคล', 'ศรีทอง', 'เพชรรัตน์', 'บุญประเสริฐ', 'สุวรรณชาติ', 'นาคสวัสดิ์', 'พึ่งบุญ', 'เรืองศรี', 'ทองคำ', 'สมบูรณ์ผล',
  'รุ่งเรือง', 'ปานทอง', 'กลิ่นหอม', 'โพธิ์ทอง', 'อ่อนศรี', 'ใจดี', 'มั่นคง', 'เกตุแก้ว', 'สีดา', 'จำปาทอง',
  'คงสมบูรณ์', 'ภู่ระหงษ์', 'ยิ้มแย้ม', 'ประเสริฐสุข', 'วงศ์ทอง', 'ดีประเสริฐ', 'แสงอรุณ', 'บัวทอง', 'นิลวงศ์', 'ทับทิม',
  'เทียนทอง', 'ศรีเมือง', 'อยู่สุข', 'ปัญญาดี', 'หอมจันทร์', 'บุญยืน', 'สุขเจริญ', 'ชื่นใจ', 'พันธ์ดี', 'เย็นใจ',
  'รักษ์ไทย', 'คำมา', 'ทองสุข', 'นาคทอง', 'มณีวงศ์', 'สิงห์ทอง', 'จันทร์แก้ว', 'พูลสวัสดิ์', 'เกิดผล', 'ศรีประเสริฐ'];
const ALIASES = ['เบียร์', 'ต้น', 'เอ็ม', 'บอย', 'แบงค์', 'โอ๊ต', 'เก่ง', 'อาร์ม', 'ตี๋', 'เสือดำ', 'แม็ก', 'ไอซ์', 'ปอนด์', 'ทอม',
  'เจ', 'กอล์ฟ', 'บิ๊ก', 'หนุ่ม', 'จ๊อบ', 'โจ้', 'น็อต', 'เปา', 'โก้', 'ดำ', 'แดง', 'ป๋อง', 'ยักษ์', 'ช้าง', 'จุก', 'เล็ก',
  'ตั้ม', 'ปู', 'หมู', 'ไก่', 'เต้ย', 'อั้ม', 'นุ้ย', 'แอน', 'จอย', 'ฝน', 'เปิ้ล', 'ป้อม', 'เสี่ยหนู', 'เฮียตง', 'ลุงแดง', 'เจ๊หมวย'];

const usedNames = new Set(mock.persons.map(p => `${p.FirstName} ${p.LastName}`));
const usedNIDs = new Set(mock.persons.map(p => p.NationalID));
const usedAliases = new Set(mock.persons.map(p => p.Alias).filter(Boolean));

const nationalId = () => {
  for (;;) {
    const d = [pick([1, 1, 1, 3, 3, 5])];
    // Province code of Nakhon Pathom (73) or neighbours, then random digits.
    const prov = pick(['73', '73', '73', '10', '74', '70', '71', '72', '63', '57']);
    d.push(+prov[0], +prov[1]);
    while (d.length < 12) d.push(randInt(0, 9));
    const sum = d.reduce((t, v, i) => t + v * (13 - i), 0);
    d.push((11 - (sum % 11)) % 10);
    const id = d.join('');
    if (!usedNIDs.has(id)) { usedNIDs.add(id); return id; }
  }
};

const makeName = (gender) => {
  for (;;) {
    const first = pick(gender === 'F' ? F_NAMES : M_NAMES);
    const last = pick(LAST_NAMES);
    const full = `${first} ${last}`;
    if (!usedNames.has(full)) { usedNames.add(full); return [first, last]; }
  }
};
const makeAlias = (gender) => {
  const pool = ALIASES.filter(a => !usedAliases.has(a) && (gender === 'F' ? !['เสี่ยหนู', 'เฮียตง', 'ลุงแดง', 'เสือดำ'].includes(a) : !['แอน', 'จอย', 'ฝน', 'เปิ้ล', 'เจ๊หมวย'].includes(a)));
  if (!pool.length || chance(0.15)) return null;
  const a = pick(pool);
  usedAliases.add(a);
  return a;
};

const ROLE_PROFILE = {
  boss:      { risk: [['Critical', 1]], female: 0.15, born: [1968, 1985], cases: 0.6 },
  manager:   { risk: [['High', 3], ['Critical', 1]], female: 0.2, born: [1975, 1992], cases: 1.6 },
  financier: { risk: [['High', 2], ['Critical', 1]], female: 0.5, born: [1970, 1988], cases: 0.4 },
  supplier:  { risk: [['Critical', 1], ['High', 1]], female: 0.1, born: [1970, 1988], cases: 0.5 },
  dealer:    { risk: [['High', 2], ['Medium', 3]], female: 0.2, born: [1980, 2000], cases: 3.4 },
  courier:   { risk: [['Medium', 3], ['High', 1]], female: 0.15, born: [1985, 2004], cases: 2.6 },
  user:      { risk: [['Low', 3], ['Medium', 1]], female: 0.25, born: [1983, 2005], cases: 1.3 },
};
const ROLE_NOTE = {
  boss: (net) => `หัวหน้า${net.label} สั่งการผ่านลูกน้องโดยตรง ไม่ปรากฏตัวในจุดส่งยา`,
  manager: (net) => `ผู้คุมจุดจำหน่ายและกระจายยาให้ลูกข่ายใน${net.label}`,
  financier: (net) => `ดูแลบัญชีรับโอนเงินค่ายาและใช้บัญชีม้าของ${net.label}`,
  supplier: (net) => `ผู้ส่งยาล็อตใหญ่ให้${net.label} รับยาจากชายแดนภาคเหนือ ติดต่อผ่านแอปพลิเคชันแชต`,
  dealer: (net) => `ผู้ค้ารายย่อยในพื้นที่ รับยาจาก${net.label}`,
  courier: (net) => `ผู้ลำเลียงยาด้วยรถจักรยานยนต์/รถกระบะให้${net.label}`,
  user: () => 'ผู้เสพและผู้ค้ารายย่อย ถูกจับกุมพร้อมยาจำนวนเล็กน้อย',
};

// Networks: territory sites decide where their cases happen.
const NETWORKS = [
  { key: 'A', label: 'เครือข่ายเดิมกลุ่มท่าข้าม', existing: [1, 2, 3, 4, 5], tambons: ['ท่าข้าม', 'ไร่ขิง'], zones: [] },
  { key: 'B', label: 'เครือข่ายเดิมกลุ่มอ้อมใหญ่', existing: [101, 102, 103, 104], tambons: ['อ้อมใหญ่', 'บ้านใหม่'], zones: [] },
  { key: 'C', label: 'เครือข่ายเดิมกลุ่มกระทุ่มล้ม', existing: [201, 202, 203, 204, 205], tambons: ['กระทุ่มล้ม', 'บางกระทึก'], zones: [] },
  { key: 'D', label: 'เครือข่ายอ้อมใหญ่-อ้อมน้อย', tambons: ['อ้อมใหญ่', 'ท่าข้าม', 'บ้านใหม่'], zones: ['south'],
    roles: { boss: 1, manager: 2, financier: 1, dealer: 4, courier: 3 }, home: 'sampran', outsideShare: 0.25 },
  { key: 'E', label: 'เครือข่ายไร่ขิง-ดอนหวาย', tambons: ['ไร่ขิง', 'บางกระทึก', 'บางเตย'], zones: [],
    roles: { boss: 1, manager: 2, dealer: 4, courier: 3 }, home: 'sampran', outsideShare: 0 },
  { key: 'F', label: 'เครือข่ายตลาดสามพราน', tambons: ['สามพราน', 'ยายชา', 'บางช้าง', 'คลองใหม่'], zones: [],
    roles: { boss: 1, manager: 2, financier: 1, dealer: 4, courier: 2 }, home: 'sampran', outsideShare: 0 },
  { key: 'G', label: 'เครือข่ายกระทุ่มล้ม-ศาลายา', tambons: ['กระทุ่มล้ม', 'ไร่ขิง'], zones: ['east'],
    roles: { boss: 1, manager: 2, dealer: 3, courier: 3 }, home: 'mixed-east', outsideShare: 0.35 },
  { key: 'H', label: 'เครือข่ายสายตะวันตก (ราชบุรี-นครชัยศรี)', tambons: ['ตลาดจินดา', 'คลองจินดา', 'ท่าตลาด', 'หอมเกร็ด'], zones: ['west'],
    roles: { boss: 1, supplier: 1, manager: 1, dealer: 3, courier: 2 }, home: 'mixed-west', outsideShare: 0.35 },
];

const persons = mock.persons.map(p => ({ ...p }));
const personMeta = new Map(); // PersonID → { role, net, home }
const existingRole = { 1: 'boss', 2: 'manager', 3: 'financier', 4: 'manager', 5: 'user', 101: 'boss', 102: 'manager', 103: 'courier', 104: 'financier', 201: 'boss', 202: 'courier', 203: 'manager', 204: 'supplier', 205: 'dealer' };
const locById = new Map(mock.locations.map(l => [l.LocationID, l]));
for (const net of NETWORKS.filter(n => n.existing)) {
  for (const id of net.existing) {
    const pl = mock.personLocations.find(x => x.PersonID === id && x.IsPrimary) || mock.personLocations.find(x => x.PersonID === id);
    const loc = locById.get(pl?.LocationID ?? persons.find(p => p.PersonID === id).CurrentAddressID);
    personMeta.set(id, { role: existingRole[id], net, sampran: loc?.District === 'สามพราน', existing: true });
  }
}

const newPersonLocations = []; // { PersonID, site, houseNo, role, primary }
let nextPersonId = 401;
const samPranHomeSite = (tambons) => {
  const tambon = weighted(tambons.map(t => [t, TAMBON_WEIGHT[t]]));
  const pool = sites.filter(x => x.zone === 'sampran' && x.tambon === tambon && (x.type === 'Home' || x.moo));
  return pool.length ? pick(pool) : pick(sites.filter(x => x.zone === 'sampran' && x.moo));
};
const addPerson = (role, net) => {
  const prof = ROLE_PROFILE[role];
  const gender = chance(prof.female) ? 'F' : 'M';
  const [FirstName, LastName] = makeName(gender);
  let home;
  if (role === 'supplier') home = pick(OUTSIDE_HOMES.supplier);
  else if (net && net.outsideShare && chance(net.outsideShare) && role !== 'dealer') home = pick(OUTSIDE_HOMES[net.zones[0]]);
  else home = samPranHomeSite(net ? net.tambons : Object.keys(TAMBON_WEIGHT));
  const houseNo = `${randInt(1, 199)}${chance(0.5) ? `/${randInt(1, 60)}` : ''}`;
  const address = addressFor(home, houseNo);
  const id = nextPersonId++;
  const person = {
    PersonID: id, FirstName, LastName, Alias: makeAlias(gender), NationalID: nationalId(),
    DateOfBirth: `${randInt(...prof.born)}-${pad(randInt(1, 12))}-${pad(randInt(1, 28))}`,
    Gender: gender, HomeAddress: address, CurrentAddress: chance(0.8) ? address : null,
    RiskLevel: weighted(prof.risk), Status: 'Active', Notes: ROLE_NOTE[role](net || {}),
    PhotoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${FirstName}+${LastName.slice(0, 4)}`).replace(/%2B/g, '+')}&background=${pick(['dc2626', 'f59e0b', '9333ea', '0ea5e9', '16a34a', '7c3aed', 'db2777', '64748b'])}&color=fff`,
  };
  persons.push(person);
  personMeta.set(id, { role, net, sampran: home.zone === 'sampran', existing: false });
  newPersonLocations.push({ PersonID: id, site: home, houseNo, role: 'Home', primary: true });
  if (['dealer', 'manager', 'courier'].includes(role) && chance(0.45) && net) {
    const work = pick(sites.filter(x => x.zone === 'sampran' && net.tambons.includes(x.tambon) && !x.moo).concat(sites.filter(x => x.zone === 'sampran' && net.tambons.includes(x.tambon))));
    newPersonLocations.push({ PersonID: id, site: work, houseNo: null, role: pick(['Workplace', 'Hangout']), primary: false });
  }
  return id;
};

for (const net of NETWORKS.filter(n => n.roles)) {
  net.members = {};
  for (const [role, n] of Object.entries(net.roles)) {
    net.members[role] = Array.from({ length: n }, () => addPerson(role, net));
  }
}
const independents = Array.from({ length: 22 }, () => addPerson('user', null));
for (const net of NETWORKS.filter(n => n.existing)) {
  net.members = {};
  for (const id of net.existing) (net.members[personMeta.get(id).role] ||= []).push(id);
}

// ── Relationships ───────────────────────────────────────────
const relationships = mock.relationships.map(r => ({ ...r }));
const relKey = new Set(relationships.map(r => [r.Person1ID, r.Person2ID].sort().join('-')));
let nextRelId = 401;
const EVIDENCE = {
  'Boss-Subordinate': ['บันทึกการสนทนาแอปพลิเคชันแชต', 'คำให้การผู้ต้องหาที่ถูกจับกุม', 'ข้อมูลการติดต่อทางโทรศัพท์ (CDR)', 'การสะกดรอยของชุดสืบสวน'],
  'Business Partner': ['การลงทุนร่วมในร้านค้าบังหน้า', 'พบเข้าออกโกดังเดียวกัน', 'ภาพจากกล้องวงจรปิด'],
  'Financial': ['ธุรกรรมโอนเงินผ่านบัญชีม้า', 'รายการเดินบัญชีธนาคาร', 'การโอนเงินผ่านพร้อมเพย์ต่อเนื่อง'],
  'Courier-Handler': ['ภาพกล้องวงจรปิดจุดส่งยา', 'คำให้การผู้ลำเลียง', 'ข้อมูลตำแหน่งโทรศัพท์ตรงกับจุดรับ-ส่ง'],
};
const addRel = (a, b, type, strength) => {
  if (!a || !b || a === b) return;
  const k = [a, b].sort().join('-');
  if (relKey.has(k)) return;
  relKey.add(k);
  relationships.push({
    RelationshipID: nextRelId++, Person1ID: a, Person2ID: b, RelationshipType: type,
    Strength: strength || weighted([['Strong', 2], ['Medium', 3], ['Weak', 1]]), Evidence: pick(EVIDENCE[type]),
  });
};
for (const net of NETWORKS.filter(n => n.roles)) {
  const m = net.members;
  const [boss] = m.boss;
  m.manager.forEach(id => addRel(boss, id, 'Boss-Subordinate', 'Strong'));
  (m.financier || []).forEach(id => addRel(boss, id, 'Financial', 'Strong'));
  (m.supplier || []).forEach(id => addRel(id, boss, 'Business Partner', 'Strong'));
  m.dealer.forEach((id, i) => addRel(m.manager[i % m.manager.length], id, 'Boss-Subordinate'));
  m.courier.forEach((id, i) => addRel(m.manager[i % m.manager.length], id, 'Courier-Handler'));
  m.courier.forEach((id, i) => addRel(id, m.dealer[i % m.dealer.length], 'Courier-Handler', 'Medium'));
  if (m.manager.length > 1) addRel(m.manager[0], m.manager[1], 'Business Partner', 'Medium');
  if (m.financier) addRel(m.financier[0], m.manager[0], 'Financial');
}
// Cross-network ties: shared suppliers and money flows create the bridges.
const N = Object.fromEntries(NETWORKS.map(n => [n.key, n]));
addRel(201, N.D.members.boss[0], 'Business Partner', 'Strong');     // existing Krathum Lom boss supplies D
addRel(204, N.G.members.boss[0], 'Business Partner', 'Medium');     // port broker ↔ G
addRel(3, N.E.members.boss[0], 'Financial', 'Strong');              // existing financier launders for E
addRel(3, N.F.members.financier[0], 'Financial', 'Medium');
addRel(N.H.members.supplier[0], N.F.members.boss[0], 'Business Partner', 'Strong'); // western supplier → F
addRel(N.H.members.supplier[0], N.D.members.manager[0], 'Business Partner', 'Weak');
addRel(101, N.D.members.manager[1], 'Business Partner', 'Medium');  // existing Om Yai ring ↔ D
addRel(102, N.D.members.dealer[0], 'Courier-Handler', 'Weak');
addRel(N.E.members.manager[1], N.G.members.manager[0], 'Business Partner', 'Medium');
addRel(1, N.F.members.manager[0], 'Boss-Subordinate', 'Weak');
addRel(N.G.members.courier[0], 202, 'Courier-Handler', 'Medium');
// Independents buy from a nearby dealer (some stay unlinked).
const allDealers = NETWORKS.filter(n => n.roles).flatMap(n => n.members.dealer);
independents.forEach((id, i) => { if (i % 2 === 0) addRel(pick(allDealers), id, 'Courier-Handler', 'Weak'); });

// ── Cases ───────────────────────────────────────────────────
const CASE_TYPE_W = [['Possession', 30], ['Trafficking', 32], ['Distribution', 25], ['Import', 4], ['Manufacturing', 2], ['Conspiracy', 7]];
const OFFICERS = ['พ.ต.ท. ธีระ วงศ์สวัสดิ์', 'พ.ต.ต. อรรถพล ศรีนวล', 'ร.ต.อ. ภาคภูมิ ทองมา', 'ร.ต.อ. ศุภกร แก้วกาญจน์',
  'พ.ต.ท. สุรศักดิ์ คงเจริญ', 'ร.ต.ท. ณัฐพล บุญรอด', 'พ.ต.ต. ชยพล เพ็ชรสุวรรณ', 'ร.ต.อ. หญิง กมลวรรณ ศรีสุวรรณ'];
const OUTSIDE_OFFICERS = { 'พุทธมณฑล': 'พ.ต.ท. วรพงษ์ สุขสม', 'นครชัยศรี': 'ร.ต.อ. สมเกียรติ ใจกล้า', 'เมืองนครปฐม': 'พ.ต.ท. ปกรณ์ แสงทอง',
  'กระทุ่มแบน': 'พ.ต.ท. ไพศาล อ่อนละมัย', 'หนองแขม': 'พ.ต.ต. นิพนธ์ ศรีเพชร', 'ทวีวัฒนา': 'ร.ต.อ. วีรยุทธ ชาญชัย', 'บางแค': 'ร.ต.อ. วีรยุทธ ชาญชัย',
  'บ้านโป่ง': 'พ.ต.ท. ธนากร พรหมสุวรรณ' };
const STATION = { 'สามพราน': 'สภ.สามพราน', 'พุทธมณฑล': 'สภ.พุทธมณฑล', 'นครชัยศรี': 'สภ.นครชัยศรี', 'เมืองนครปฐม': 'สภ.เมืองนครปฐม',
  'กระทุ่มแบน': 'สภ.กระทุ่มแบน', 'หนองแขม': 'สน.หนองแขม', 'ทวีวัฒนา': 'สน.ทวีวัฒนา', 'บางแค': 'สน.บางแค', 'บ้านโป่ง': 'สภ.บ้านโป่ง' };

const statusFor = (date) => {
  const y = date.getFullYear(), m = date.getMonth();
  if (y === 2024) return weighted([['Adjudicated', 45], ['Closed', 20], ['Court', 18], ['Appealed', 5], ['Filed', 12]]);
  if (y === 2025 && m < 6) return weighted([['Court', 30], ['Filed', 30], ['Adjudicated', 15], ['Under Investigation', 20], ['Pending', 5]]);
  if (y === 2025) return weighted([['Under Investigation', 40], ['Filed', 30], ['Court', 15], ['Pending', 15]]);
  return weighted([['Under Investigation', 65], ['Pending', 20], ['Filed', 15]]);
};

// Monthly volume rises over time (2024-01 … 2026-10).
const months = [];
for (let y = 2024; y <= 2026; y++) for (let m = 0; m < 12; m++) if (!(y === 2026 && m > 9)) months.push([y, m, 1 + (y - 2024) * 0.45 + m * 0.02]);
const randomDate = () => {
  const [y, m] = weighted(months.map(x => [[x[0], x[1]], x[2]]));
  const last = new Date(y, m + 1, 0).getDate();
  const day = randInt(1, y === 2026 && m === 9 ? 20 : last);
  const hour = weighted([[pick([19, 20, 21, 22, 23]), 5], [pick([0, 1, 2, 3, 4]), 4], [randInt(8, 18), 3]]);
  return new Date(y, m, day, hour, pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]));
};
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const usedCaseNumbers = new Set(mock.cases.map(c => c.CaseNumber));
const caseSeq = { 2567: 1, 2568: 1, 2569: 1 };
const nextCaseNumber = (date) => {
  const be = date.getFullYear() + 543;
  for (;;) {
    const cn = `NCB-CR-${be}-${pad(caseSeq[be]++, 4)}`;
    if (!usedCaseNumbers.has(cn)) { usedCaseNumbers.add(cn); return cn; }
  }
};

// Drug seizure model per case type.
const DRUG_TH = { Methamphetamine: 'ยาบ้า', 'Crystal Meth': 'ยาไอซ์', Heroin: 'เฮโรอีน', Ketamine: 'เคตามีน', Ecstasy: 'ยาอี', Cannabis: 'กัญชา' };
const qtyRound = (v) => (v >= 1000 ? Math.round(v / 100) * 100 : v >= 100 ? Math.round(v / 10) * 10 : Math.round(v));
const makeSeizure = (type, outsideArea) => {
  const drug = {
    Possession: [['Methamphetamine', 7], ['Crystal Meth', 3], ['Ketamine', 0.4], ['Ecstasy', 0.4]],
    Distribution: [['Methamphetamine', 7], ['Crystal Meth', 3], ['Ketamine', 0.6], ['Ecstasy', 0.6]],
    Trafficking: [['Methamphetamine', 6], ['Crystal Meth', 3.5], ['Heroin', 0.6], ['Ketamine', 0.4]],
    Import: [['Crystal Meth', 3], ['Heroin', 2], ['Methamphetamine', 2], ['Ketamine', 1]],
    Manufacturing: [['Crystal Meth', 1], ['Methamphetamine', 1]],
    Conspiracy: [['Methamphetamine', 1]],
  }[type];
  const d = weighted(drug);
  const scale = { Possession: 1, Distribution: 8, Trafficking: 60, Import: 400, Manufacturing: 300, Conspiracy: 20 }[type] * (outsideArea ? 1.5 : 1);
  let Quantity, Unit, perUnit;
  if (d === 'Methamphetamine') { Quantity = qtyRound(randInt(8, 40) * scale * (0.5 + rand())); Unit = 'pills'; perUnit = randInt(60, 90); }
  else if (d === 'Ecstasy') { Quantity = qtyRound(randInt(5, 30) * Math.sqrt(scale)); Unit = 'pills'; perUnit = 600; }
  else {
    const grams = randInt(2, 15) * scale * (0.5 + rand());
    perUnit = { 'Crystal Meth': 1500, Heroin: 1000, Ketamine: 1200 }[d];
    if (grams >= 1000) { Quantity = round(grams / 1000, 1); Unit = 'kg'; perUnit *= 1000; }
    else { Quantity = qtyRound(grams); Unit = 'g'; }
  }
  return { DrugType: d, Quantity, Unit, EstimatedValue: Math.round(Quantity * perUnit / 100) * 100 };
};
const fmtQty = (s) => `${DRUG_TH[s.DrugType]} ${s.Quantity} ${{ pills: 'เม็ด', kg: 'กก.', g: 'กรัม' }[s.Unit]}`;
const describe = (type, site, seizures) => {
  const where = site.moo ? `${site.name} ต.${site.tambon}` : site.name;
  const items = seizures.map(fmtQty).join(' และ ');
  switch (type) {
    case 'Possession': return `จับกุมผู้ต้องหาพร้อม${items} บริเวณ${where}`;
    case 'Distribution': return `ล่อซื้อและจับกุมผู้ค้ารายย่อยพร้อม${items} บริเวณ${where}`;
    case 'Trafficking': return seizures.length ? `สกัดจับการลำเลียง${items} บริเวณ${where}` : `จับกุมผู้ต้องหาตามหมายจับข้อหาร่วมกันค้ายาเสพติด บริเวณ${where}`;
    case 'Import': return `ตรวจยึด${items} ที่ลักลอบนำเข้ามาพักไว้บริเวณ${where}`;
    case 'Manufacturing': return `บุกค้นจุดแบ่งบรรจุและอัดเม็ดยา พบ${items} บริเวณ${where}`;
    default: return `ขยายผลจับกุมผู้ร่วมสมคบค้ายาเสพติด บริเวณ${where}${items ? ` พบ${items}` : ''}`;
  }
};

const cases = [];
const seizures = [];
const casePersons = [];
let nextCaseId = 1001, nextSeizureId = 1001, nextCpId = 1001;

// Carry over the existing demo records unchanged.
for (const c of mock.cases) cases.push({ ...c, _loc: locById.get(c.LocationID) });
for (const sz of mock.drugSeizures) seizures.push({ ...sz });
for (const cp of mock.casePersons) casePersons.push({ ...cp });

const caseSites = new Map();
const membersOf = (net, roles) => roles.flatMap(r => net.members[r] || []);
const sampranMembers = (net) => membersOf(net, ['dealer', 'courier', 'manager', 'boss', 'financier']).filter(id => personMeta.get(id).sampran);

// Dates are drawn up front and sorted so case numbers run in arrest-date order.
const caseDates = Array.from({ length: NEW_CASES }, randomDate).sort((a, b) => a - b);
for (let i = 0; i < NEW_CASES; i++) {
  const outside = i % 7 === 3; // ~14% outside Sam Phran
  const site = outside
    ? weighted(sites.filter(x => x.zone !== 'sampran').map(x => [x, x.w]))
    : weighted(sites.filter(x => x.zone === 'sampran').map(x => [x, x.w * (TAMBON_WEIGHT[x.tambon] ** 0.5)]));
  const type = site.type === 'Checkpoint' ? weighted([['Trafficking', 5], ['Possession', 2], ['Import', 1]])
    : site.type === 'Warehouse' ? weighted([['Trafficking', 2], ['Manufacturing', 1], ['Import', 1]])
      : weighted(CASE_TYPE_W);
  const date = caseDates[i];
  const caseNumber = nextCaseNumber(date);
  const nSeiz = type === 'Conspiracy' ? (chance(0.3) ? 1 : 0)
    : type === 'Trafficking' ? weighted([[0, 1], [1, 6], [2, 2]])
      : type === 'Import' ? weighted([[1, 2], [2, 1]])
        : weighted([[0, 1], [1, 10], [2, 1]]);
  const caseSeizures = [];
  for (let k = 0; k < nSeiz; k++) {
    let sz = makeSeizure(type, outside);
    if (caseSeizures.some(x => x.DrugType === sz.DrugType)) sz = makeSeizure(type, outside);
    if (caseSeizures.some(x => x.DrugType === sz.DrugType)) continue;
    caseSeizures.push(sz);
  }
  const district = site.district;
  const c = {
    CaseID: nextCaseId++, CaseNumber: caseNumber, CaseType: type, ArrestDate: iso(date),
    Status: statusFor(date), Description: describe(type, site, caseSeizures),
    OfficerInCharge: district === 'สามพราน' ? pick(OFFICERS) : OUTSIDE_OFFICERS[district],
    _site: site,
  };
  cases.push(c);
  caseSites.set(c.CaseID, site);
  for (const sz of caseSeizures) {
    seizures.push({
      SeizureID: nextSeizureId++, CaseID: c.CaseID, ...sz,
      StorageLocation: `คลังเก็บของกลาง ${STATION[district]}`,
      Notes: sz.DrugType === 'Methamphetamine' ? pick(['ยาบ้าตรา WY สีส้ม', 'ยาบ้าตรา WY บรรจุถุงละ 200 เม็ด', 'ยาบ้าสีชมพูตรา WY', 'แบ่งบรรจุหลอดกาแฟ'])
        : sz.DrugType === 'Crystal Meth' ? pick(['บรรจุถุงชาจีน', 'แบ่งบรรจุถุงซิปล็อกขนาดเล็ก', 'ยาไอซ์เกล็ดใส']) : 'ส่งตรวจพิสูจน์ที่ศูนย์พิสูจน์หลักฐาน',
    });
  }

  // Persons involved: network by territory; outside cases always include a Sam Phran resident.
  let net;
  if (outside) net = pick(NETWORKS.filter(n => n.zones.includes(site.zone)));
  else {
    const local = NETWORKS.filter(n => n.tambons.includes(site.tambon));
    net = local.length && chance(0.85) ? weighted(local.map(n => [n, n.roles ? 3 : 1])) : null;
  }
  const involved = [];
  const add = (id, role, detail) => {
    if (!id || involved.some(x => x.id === id)) return;
    involved.push({ id, role, detail });
  };
  if (!net || (type === 'Possession' && chance(0.55))) {
    add(pick(independents), 'Main Suspect', 'ผู้ต้องหาถูกจับกุมพร้อมของกลาง');
    if (net && chance(0.4)) add(pick(net.members.dealer || net.members.courier || net.existing), 'Accomplice', 'ผู้จำหน่ายยาให้ผู้ต้องหา ขยายผลจากคำให้การ');
  } else {
    const front = membersOf(net, type === 'Trafficking' || type === 'Import' ? ['courier', 'dealer'] : ['dealer', 'courier']);
    const main = pick(front.length ? front : net.existing);
    add(main, ['Trafficking', 'Import'].includes(type) && personMeta.get(main).role === 'courier' ? 'Courier' : 'Main Suspect', 'ผู้ต้องหาหลักในที่เกิดเหตุ');
    if (chance(0.55)) add(pick(membersOf(net, ['courier', 'dealer', 'manager'])), chance(0.5) ? 'Accomplice' : 'Courier', 'ร่วมกระทำผิด ผู้ลำเลียง/ผู้ช่วยส่งยา');
    if (['Trafficking', 'Import', 'Manufacturing', 'Conspiracy'].includes(type) && chance(0.45)) {
      add(pick(membersOf(net, ['manager', 'boss', 'supplier'])), 'Mastermind', 'ผู้สั่งการ ขยายผลจากข้อมูลการติดต่อสื่อสาร');
    }
    if (outside && !involved.some(x => personMeta.get(x.id).sampran)) {
      add(pick(sampranMembers(net)), 'Accomplice', 'ผู้ต้องหาภูมิลำเนาอำเภอสามพราน เชื่อมโยงกับคดีในพื้นที่');
    }
  }
  for (const x of involved) {
    casePersons.push({ CasePersonID: nextCpId++, CaseID: c.CaseID, PersonID: x.id, Role: x.role, InvolvementDetails: x.detail });
  }
}

// Person status follows their case history (generated persons only).
const caseById = new Map(cases.map(c => [c.CaseID, c]));
for (const p of persons) {
  const meta = personMeta.get(p.PersonID);
  if (meta.existing) continue;
  const links = casePersons.filter(cp => cp.PersonID === p.PersonID).map(cp => ({ ...cp, c: caseById.get(cp.CaseID) }));
  const charged = links.filter(l => ['Filed', 'Court', 'Adjudicated', 'Appealed', 'Closed'].includes(l.c.Status) && l.Role !== 'Mastermind');
  if (charged.length) {
    const latest = charged.map(l => l.c.ArrestDate).sort().pop();
    const latestAny = links.map(l => l.c.ArrestDate).sort().pop();
    if (latestAny > latest) p.Status = 'Suspect'; // re-offended after release, open case pending
    else p.Status = meta.role === 'user' && latest < '2025-01-01' && chance(0.6) ? 'Released' : 'Arrested';
  } else if (links.length) p.Status = chance(0.6) ? 'Suspect' : 'Active';
  else p.Status = 'Active';
  if (meta.role === 'boss' && p.Status === 'Arrested' && chance(0.5)) p.Status = 'Active';
}

// ── Emit ────────────────────────────────────────────────────
const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const str = String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const writeCsv = (file, header, rows) => {
  const body = [header.join(','), ...rows.map(r => header.map(h => csvCell(r[h])).join(','))].join('\n');
  fs.writeFileSync(path.join(OUT, file), `${body}\n`);
};
const sql = (v) => (v === null || v === undefined || v === '' ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v).toUpperCase() : `'${String(v).replace(/'/g, "''")}'`);

fs.mkdirSync(OUT, { recursive: true });

// cases_import.csv — columns understood by POST /api/upload/csv
const importRows = cases.map(c => {
  if (c._loc) {
    const l = c._loc;
    return {
      case_number: c.CaseNumber, case_type: c.CaseType, latitude: l.Latitude, longitude: l.Longitude,
      description: c.Description, arrest_date: c.ArrestDate, status: c.Status, officer_in_charge: c.OfficerInCharge,
      province: l.Province, district: l.District, sub_district: l.SubDistrict, address_detail: l.AddressDetail,
      location_type: l.LocationType, postal_code: l.PostalCode,
    };
  }
  // Repeat incidents at one site share its geocoded point, as in the original demo.
  const site = c._site;
  return {
    case_number: c.CaseNumber, case_type: c.CaseType,
    latitude: site.lat, longitude: site.lng,
    description: c.Description, arrest_date: c.ArrestDate, status: c.Status, officer_in_charge: c.OfficerInCharge,
    province: site.province, district: site.district, sub_district: site.tambon, address_detail: addressFor(site),
    location_type: site.type, postal_code: site.postal,
  };
});
writeCsv('cases_import.csv', ['case_number', 'case_type', 'latitude', 'longitude', 'description', 'arrest_date', 'status',
  'officer_in_charge', 'province', 'district', 'sub_district', 'address_detail', 'location_type', 'postal_code'], importRows);

const caseNumberOf = new Map(cases.map(c => [c.CaseID, c.CaseNumber]));
const personNid = new Map(persons.map(p => [p.PersonID, p.NationalID]));

// Person locations: existing ones keep their mockData coordinates.
const plRows = [];
for (const pl of mock.personLocations) {
  const l = locById.get(pl.LocationID);
  plRows.push({ PersonID: pl.PersonID, NationalID: personNid.get(pl.PersonID), LocationRole: pl.LocationRole, IsPrimary: pl.IsPrimary,
    StartDate: pl.StartDate, EndDate: pl.EndDate, AddressDetail: l.AddressDetail, Latitude: l.Latitude, Longitude: l.Longitude,
    LocationType: l.LocationType, Province: l.Province, District: l.District, SubDistrict: l.SubDistrict, PostalCode: l.PostalCode });
}
for (const pl of newPersonLocations) {
  const site = pl.site;
  plRows.push({ PersonID: pl.PersonID, NationalID: personNid.get(pl.PersonID), LocationRole: pl.role, IsPrimary: pl.primary,
    StartDate: `${randInt(2018, 2024)}-${pad(randInt(1, 12))}-01`, EndDate: null,
    AddressDetail: addressFor(site, pl.houseNo), Latitude: round(site.lat + (rand() - 0.5) * 0.002), Longitude: round(site.lng + (rand() - 0.5) * 0.002),
    LocationType: pl.role === 'Home' ? 'Home' : site.type === 'Home' ? 'Other' : site.type,
    Province: site.province, District: site.district, SubDistrict: site.tambon, PostalCode: site.postal });
}

const PERSON_COLS = ['PersonID', 'FirstName', 'LastName', 'Alias', 'NationalID', 'DateOfBirth', 'Gender', 'HomeAddress', 'CurrentAddress', 'RiskLevel', 'Status', 'Notes', 'PhotoURL'];
writeCsv('persons.csv', PERSON_COLS, persons);
writeCsv('person_locations.csv', ['PersonID', 'NationalID', 'LocationRole', 'IsPrimary', 'StartDate', 'EndDate', 'AddressDetail', 'Latitude', 'Longitude', 'LocationType', 'Province', 'District', 'SubDistrict', 'PostalCode'], plRows);
writeCsv('drug_seizures.csv', ['SeizureID', 'CaseNumber', 'DrugType', 'Quantity', 'Unit', 'EstimatedValue', 'StorageLocation', 'Notes'],
  seizures.map(sz => ({ ...sz, CaseNumber: caseNumberOf.get(sz.CaseID) })));
writeCsv('case_persons.csv', ['CasePersonID', 'CaseNumber', 'PersonID', 'NationalID', 'Role', 'InvolvementDetails'],
  casePersons.map(cp => ({ ...cp, CaseNumber: caseNumberOf.get(cp.CaseID), NationalID: personNid.get(cp.PersonID) })));
writeCsv('relationships.csv', ['RelationshipID', 'Person1ID', 'Person2ID', 'Person1NationalID', 'Person2NationalID', 'RelationshipType', 'Strength', 'Evidence'],
  relationships.map(r => ({ ...r, Person1NationalID: personNid.get(r.Person1ID), Person2NationalID: personNid.get(r.Person2ID) })));

// related_data.sql — run AFTER importing cases_import.csv. Joins on case_number /
// national_id, so it does not depend on the serial IDs the import assigned.
const values = (rows) => rows.map(r => `  (${r.map(sql).join(', ')})`).join(',\n');
const out = [];
out.push(`-- ============================================================
-- DTID Dashboard — expanded demo dataset: related records
-- Generated by scripts/generateDemoDataset.mjs (seed ${SEED}). Synthetic data only.
--
-- Run AFTER cases_import.csv has been imported through
-- Admin > Import Cases from CSV (POST /api/upload/csv):
--   psql -U postgres -d dtid_dashboard -f demo-data/related_data.sql
-- Rows whose case_number / national_id is not in the database are skipped.
-- Safe to re-run: existing rows are not duplicated.
-- ============================================================
BEGIN;
`);
out.push(`-- 1. PERSONS (${persons.length})
-- person_id is kept so IDs match persons.csv and the original demo (1-5, 101-104, 201-205).
INSERT INTO person (person_id, national_id, first_name, last_name, alias, date_of_birth, gender, home_address, current_address, photo_url, risk_level, status, notes) VALUES
${values(persons.map(p => [p.PersonID, p.NationalID, p.FirstName, p.LastName, p.Alias, p.DateOfBirth, p.Gender, p.HomeAddress, p.CurrentAddress, p.PhotoURL, p.RiskLevel, p.Status, p.Notes]))}
ON CONFLICT DO NOTHING;
SELECT setval('person_person_id_seq', GREATEST((SELECT MAX(person_id) FROM person), 1));
`);
out.push(`-- 2. PERSON LOCATIONS (${plRows.length}) — one location row per address
CREATE TEMP TABLE _pl (national_id TEXT, location_role TEXT, is_primary BOOLEAN, start_date DATE, end_date DATE, address_detail TEXT, lat DOUBLE PRECISION, lng DOUBLE PRECISION, location_type TEXT, province TEXT, district TEXT, sub_district TEXT, postal_code TEXT, location_id INT) ON COMMIT DROP;
INSERT INTO _pl (national_id, location_role, is_primary, start_date, end_date, address_detail, lat, lng, location_type, province, district, sub_district, postal_code) VALUES
${values(plRows.map(r => [r.NationalID, r.LocationRole, r.IsPrimary, r.StartDate, r.EndDate, r.AddressDetail, r.Latitude, r.Longitude, r.LocationType, r.Province, r.District, r.SubDistrict, r.PostalCode]))};
DELETE FROM _pl t USING person p, person_location x
  WHERE p.national_id = t.national_id AND x.person_id = p.person_id AND x.location_role = t.location_role;
WITH ins AS (
  INSERT INTO location (address_detail, geom, location_type, province, district, sub_district, postal_code)
  SELECT address_detail, ST_SetSRID(ST_MakePoint(lng, lat), 4326), location_type, province, district, sub_district, postal_code
  FROM _pl ORDER BY national_id, location_role
  RETURNING location_id
), numbered AS (SELECT location_id, row_number() OVER (ORDER BY location_id) AS rn FROM ins),
src AS (SELECT ctid AS c, row_number() OVER (ORDER BY national_id, location_role) AS rn FROM _pl)
UPDATE _pl SET location_id = numbered.location_id FROM src JOIN numbered USING (rn) WHERE _pl.ctid = src.c;
INSERT INTO person_location (person_id, location_id, location_role, is_primary, start_date, end_date)
SELECT p.person_id, t.location_id, t.location_role, t.is_primary, t.start_date, t.end_date
FROM _pl t JOIN person p ON p.national_id = t.national_id;
`);
out.push(`-- 3. DRUG SEIZURES (${seizures.length})
INSERT INTO drug_seizure (case_id, drug_type, quantity, unit, estimated_value, storage_location, notes)
SELECT i.case_id, v.drug_type, v.quantity, v.unit, v.estimated_value, v.storage_location, v.notes
FROM (VALUES
${values(seizures.map(sz => [caseNumberOf.get(sz.CaseID), sz.DrugType, sz.Quantity, sz.Unit, sz.EstimatedValue, sz.StorageLocation, sz.Notes]))}
) AS v(case_number, drug_type, quantity, unit, estimated_value, storage_location, notes)
JOIN incident i ON i.case_number = v.case_number
WHERE NOT EXISTS (SELECT 1 FROM drug_seizure d WHERE d.case_id = i.case_id AND d.drug_type = v.drug_type AND d.quantity = v.quantity::numeric);
`);
out.push(`-- 4. CASE ↔ PERSON LINKS (${casePersons.length})
INSERT INTO case_person (case_id, person_id, role, involvement_details)
SELECT i.case_id, p.person_id, v.role, v.details
FROM (VALUES
${values(casePersons.map(cp => [caseNumberOf.get(cp.CaseID), personNid.get(cp.PersonID), cp.Role, cp.InvolvementDetails]))}
) AS v(case_number, national_id, role, details)
JOIN incident i ON i.case_number = v.case_number
JOIN person p ON p.national_id = v.national_id
ON CONFLICT (case_id, person_id, role) DO NOTHING;
`);
out.push(`-- 5. RELATIONSHIPS (${relationships.length})
INSERT INTO person_relationship (person1_id, person2_id, relationship_type, strength, evidence)
SELECT p1.person_id, p2.person_id, v.rel_type, v.strength, v.evidence
FROM (VALUES
${values(relationships.map(r => [personNid.get(r.Person1ID), personNid.get(r.Person2ID), r.RelationshipType, r.Strength, r.Evidence]))}
) AS v(nid1, nid2, rel_type, strength, evidence)
JOIN person p1 ON p1.national_id = v.nid1
JOIN person p2 ON p2.national_id = v.nid2
WHERE NOT EXISTS (SELECT 1 FROM person_relationship r WHERE r.person1_id = p1.person_id AND r.person2_id = p2.person_id);

COMMIT;

-- Row counts after loading
SELECT 'incident' AS table_name, COUNT(*) FROM incident
UNION ALL SELECT 'person', COUNT(*) FROM person
UNION ALL SELECT 'drug_seizure', COUNT(*) FROM drug_seizure
UNION ALL SELECT 'case_person', COUNT(*) FROM case_person
UNION ALL SELECT 'person_relationship', COUNT(*) FROM person_relationship
UNION ALL SELECT 'person_location', COUNT(*) FROM person_location;
`);
fs.writeFileSync(path.join(OUT, 'related_data.sql'), out.join('\n'));

const inSampran = importRows.filter(r => r.district === 'สามพราน').length;
const outsideCases = cases.filter(c => c._site && c._site.zone !== 'sampran');
const outsideLinked = outsideCases.filter(c => casePersons.some(cp => cp.CaseID === c.CaseID && personMeta.get(cp.PersonID).sampran)).length;
console.log(JSON.stringify({
  cases: cases.length, casesInSamPhran: inSampran, casesOutside: cases.length - inSampran,
  outsideCasesLinkedToSamPhranPerson: `${outsideLinked}/${outsideCases.length}`,
  persons: persons.length, personsLivingInSamPhran: [...personMeta.values()].filter(m => m.sampran).length,
  drugSeizures: seizures.length, casePersons: casePersons.length, relationships: relationships.length,
  personLocations: plRows.length, casesWithoutPersons: cases.filter(c => !casePersons.some(cp => cp.CaseID === c.CaseID)).length,
}, null, 2));
