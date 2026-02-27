const { body } = require('express-validator');

/**
 * Validation rules for creating an event.
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const createEventRules = [
  body('type')
    .isIn(['vaccine', 'walk', 'meal', 'vet'])
    .withMessage('Type must be one of: vaccine, walk, meal, vet'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('event_date')
    .isISO8601()
    .withMessage('Event date must be a valid ISO 8601 date'),
  body('next_due_date')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid ISO 8601 date'),
];

/**
 * Validation rules for updating an event (type cannot be changed).
 *
 * @type {import('express-validator').ValidationChain[]}
 */
const updateEventRules = [
  body('type')
    .not()
    .exists()
    .withMessage('Event type cannot be changed'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .optional()
    .trim(),
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid ISO 8601 date'),
  body('next_due_date')
    .optional()
    .isISO8601()
    .withMessage('Next due date must be a valid ISO 8601 date'),
];

module.exports = { createEventRules, updateEventRules };
