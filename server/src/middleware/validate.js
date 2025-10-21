import { validationResult } from 'express-validator';

/**
 * Validation middleware to check for validation errors
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // TEMPORARY DEBUG LOGGING - TO BE REMOVED AFTER FIX
    console.log('❌ VALIDATION FAILED');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2));
    console.log('---');

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};
