// ============================================================
// Canonical enumerations (single source of truth).
// Superset of every value present in mock data, the forms, and the DB schema,
// so controlled <select>s always contain the current record's value and
// filters/stat counters use one consistent vocabulary.
// ============================================================

export const PERSON_STATUSES = [
  { value: 'Active',   label: 'เฝ้าระวัง' },
  { value: 'Suspect',  label: 'ผู้ต้องสงสัย' },
  { value: 'Arrested', label: 'ถูกจับกุม' },
  { value: 'Released', label: 'ปล่อยตัว' },
  { value: 'Deceased', label: 'เสียชีวิต' },
  { value: 'Unknown',  label: 'ไม่ทราบสถานะ' },
];
export const PERSON_STATUS_VALUES = PERSON_STATUSES.map((s) => s.value);

// "At large" = not in custody; "detained" = in custody.
export const AT_LARGE_STATUSES = ['Active', 'Suspect'];
export const DETAINED_STATUSES = ['Arrested'];

export const RISK_LEVELS = [
  { value: 'Low',      label: 'ต่ำ' },
  { value: 'Medium',   label: 'ปานกลาง' },
  { value: 'High',     label: 'สูง' },
  { value: 'Critical', label: 'วิกฤต' },
];
export const RISK_LEVEL_VALUES = RISK_LEVELS.map((r) => r.value);

export const GENDERS = [
  { value: 'M', label: 'ชาย' },
  { value: 'F', label: 'หญิง' },
  { value: 'O', label: 'อื่นๆ' },
];

export const CASE_TYPES = [
  { value: 'Possession',    label: 'ครอบครอง' },
  { value: 'Trafficking',   label: 'ค้า/จำหน่าย' },
  { value: 'Distribution',  label: 'จัดจำหน่าย' },
  { value: 'Manufacturing', label: 'ผลิต' },
  { value: 'Import',        label: 'นำเข้า' },
  { value: 'Export',        label: 'ส่งออก' },
  { value: 'Conspiracy',    label: 'สมคบ' },
  { value: 'Smuggling',     label: 'ลักลอบนำเข้า' },
  { value: 'Forgery',       label: 'ปลอมแปลงเอกสาร' },
  { value: 'Vehicle Theft', label: 'โจรกรรมรถยนต์' },
  { value: 'Other',         label: 'อื่นๆ' },
];

export const CASE_STATUSES = [
  { value: 'Under Investigation', label: 'อยู่ระหว่างสืบสวน' },
  { value: 'Pending',             label: 'รอดำเนินการ' },
  { value: 'Filed',               label: 'ส่งฟ้อง' },
  { value: 'Court',               label: 'อยู่ระหว่างพิจารณาคดี' },
  { value: 'Adjudicated',         label: 'ศาลตัดสินแล้ว' },
  { value: 'Closed',              label: 'ปิดคดี' },
  { value: 'Appealed',            label: 'อุทธรณ์' },
];

export const RELATIONSHIP_TYPES = [
  { value: 'Boss-Subordinate', label: 'สั่งการ-รับคำสั่ง' },
  { value: 'Business Partner', label: 'หุ้นส่วนธุรกิจ' },
  { value: 'Financial',        label: 'ความสัมพันธ์ทางการเงิน' },
  { value: 'Courier-Handler',  label: 'ผู้ลำเลียง' },
];

/** Thai label for a value in one of the option lists (falls back to the raw value). */
export const labelFor = (options, value) => options.find((o) => o.value === value)?.label ?? value;
