const { body } = require('express-validator');

/**
 * Validation rules for user registration.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const registerRules = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name must be at most 50 characters'),
];

/**
 * Validation rules for user login.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const loginRules = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
