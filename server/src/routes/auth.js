const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerRules, loginRules } = require('../validators/auth');
const validate = require('../validators/validate');
const userQueries = require('../db/queries/users');

const router = express.Router();

/**
 * Register a new user.
 *
 * @route POST /api/auth/register
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password (min 8 chars)
 * @param {string} req.body.first_name - User first name
 * @returns {Object} 201 - Token and user data
 * @returns {Object} 409 - Email already in use
 */
router.post('/register', registerRules, validate, async (req, res, next) => {
  try {
    const { email, password, first_name } = req.body;

    const existing = await userQueries.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already in use', code: 'CONFLICT' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userQueries.create({ email, passwordHash, firstName: first_name });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Log in an existing user.
 *
 * @route POST /api/auth/login
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {Object} 200 - Token and user data
 * @returns {Object} 401 - Invalid credentials
 */
router.post('/login', loginRules, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password', code: 'UNAUTHORIZED' },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password', code: 'UNAUTHORIZED' },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
