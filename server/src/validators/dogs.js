const { body } = require('express-validator');

/**
 * Validation rules for creating a dog.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createDogRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Breed must be at most 100 characters'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date (YYYY-MM-DD)'),
  body('weight_kg')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Weight must be between 0 and 200 kg'),
];

/**
 * Validation rules for updating a dog (all fields optional).
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateDogRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Breed must be at most 100 characters'),
  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('Birth date must be a valid date (YYYY-MM-DD)'),
  body('weight_kg')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('Weight must be between 0 and 200 kg'),
];

module.exports = { createDogRules, updateDogRules };
