// ============================================================
// Thin wrapper around express-validator: run a set of validation
// chains, then short-circuit with 400 + the collected errors.
// Usage:  app.post('/x', validate([ body('a').isInt() ]), handler)
// ============================================================
import { validationResult } from 'express-validator';

export function validate(chains) {
  return [
    ...chains,
    (req, res, next) => {
      const result = validationResult(req);
      if (result.isEmpty()) return next();
      return res.status(400).json({
        message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง',
        errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    },
  ];
}
