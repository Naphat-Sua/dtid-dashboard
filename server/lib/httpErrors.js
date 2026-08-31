// ============================================================
// Map low-level errors (PostgreSQL driver codes, Multer, validation)
// to appropriate HTTP status codes + safe client messages.
// Kept as a pure function so it can be unit-tested without a live DB.
// ============================================================

// PostgreSQL error codes → HTTP status.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const PG_STATUS = {
  '23505': 409, // unique_violation        → conflict (duplicate)
  '23503': 409, // foreign_key_violation   → conflict (referenced row missing/in use)
  '23502': 400, // not_null_violation       → bad request (missing required field)
  '23514': 400, // check_violation          → bad request (value out of allowed set)
  '22P02': 400, // invalid_text_representation (e.g. 'abc' for an integer column)
  '22003': 400, // numeric_value_out_of_range
  '23P01': 409, // exclusion_violation
};

// Friendly, non-leaky messages per code.
const PG_MESSAGE = {
  '23505': 'ข้อมูลซ้ำกับที่มีอยู่แล้ว (ค่าที่ต้องไม่ซ้ำถูกใช้ไปแล้ว)',
  '23503': 'อ้างอิงข้อมูลที่ไม่มีอยู่ หรือข้อมูลนี้ถูกใช้งานโดยรายการอื่น',
  '23502': 'ข้อมูลไม่ครบ: มีฟิลด์ที่จำเป็นถูกเว้นว่าง',
  '23514': 'ค่าที่ส่งมาไม่อยู่ในชุดค่าที่อนุญาต',
  '22P02': 'รูปแบบข้อมูลไม่ถูกต้อง',
  '22003': 'ค่าตัวเลขเกินช่วงที่กำหนด',
};

/**
 * @param {any} err
 * @returns {{ status: number, message: string, expose: boolean }}
 *   expose=true means `message` is safe to send to the client verbatim.
 */
export function mapError(err) {
  if (!err) return { status: 500, message: 'Internal server error', expose: false };

  // Multer file-size limit.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, message: 'ไฟล์มีขนาดใหญ่เกินกำหนด (สูงสุด 5MB)', expose: true };
  }
  // Multer / other unexpected-file errors are surfaced as 400.
  if (typeof err.code === 'string' && err.code.startsWith('LIMIT_')) {
    return { status: 400, message: 'การอัปโหลดไฟล์ไม่ถูกต้อง', expose: true };
  }
  // Our own csv fileFilter rejection.
  if (err.message === 'Only .csv files are accepted') {
    return { status: 415, message: 'รองรับเฉพาะไฟล์ .csv เท่านั้น', expose: true };
  }

  // PostgreSQL driver error (has a SQLSTATE `code`).
  if (typeof err.code === 'string' && PG_STATUS[err.code]) {
    return {
      status: PG_STATUS[err.code],
      message: PG_MESSAGE[err.code] || 'คำขอไม่ถูกต้อง',
      expose: true,
    };
  }

  // An error we deliberately threw with an explicit status.
  if (Number.isInteger(err.status) && err.status >= 400 && err.status < 600) {
    return { status: err.status, message: err.message || 'Request failed', expose: true };
  }

  return { status: 500, message: 'Internal server error', expose: false };
}
