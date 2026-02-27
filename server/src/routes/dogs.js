const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../middleware/auth');
const { createDogRules, updateDogRules } = require('../validators/dogs');
const validate = require('../validators/validate');
const dogQueries = require('../db/queries/dogs');
const eventQueries = require('../db/queries/events');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Multer configuration for photo uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/dogs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

/**
 * Filter uploaded files to only accept JPEG, PNG, and WebP images.
 *
 * @param {import('express').Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Verify that a dog belongs to the authenticated user.
 * Returns the dog if ownership is confirmed, or sends an error response.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} userId - The authenticated user's UUID
 * @param {import('express').Response} res
 * @returns {Promise<Object|null>} The dog object or null if an error was sent
 */
const verifyOwnership = async (dogId, userId, res) => {
  const dog = await dogQueries.findById(dogId);
  if (!dog) {
    res.status(404).json({
      success: false,
      error: { message: 'Dog not found', code: 'NOT_FOUND' },
    });
    return null;
  }
  if (dog.user_id !== userId) {
    res.status(403).json({
      success: false,
      error: { message: 'Access denied', code: 'FORBIDDEN' },
    });
    return null;
  }
  return dog;
};

/**
 * List all dogs belonging to the authenticated user.
 *
 * @route GET /api/dogs
 * @returns {Object} 200 - Array of dog objects with upcoming_events_count
 */
router.get('/', async (req, res, next) => {
  try {
    const dogs = await dogQueries.findByUserId(req.user.userId);
    res.json({ success: true, data: dogs });
  } catch (err) {
    next(err);
  }
});

/**
 * Get upcoming vaccine reminders for all dogs of the authenticated user.
 *
 * @route GET /api/dogs/vaccines/upcoming
 * @returns {Object} 200 - Array of vaccine reminder objects
 */
router.get('/vaccines/upcoming', async (req, res, next) => {
  try {
    const vaccines = await eventQueries.findUpcomingVaccines(req.user.userId);
    res.json({ success: true, data: vaccines });
  } catch (err) {
    next(err);
  }
});

/**
 * Create a new dog for the authenticated user.
 *
 * @route POST /api/dogs
 * @param {string} req.body.name - The dog's name (required)
 * @param {string} [req.body.breed] - The dog's breed
 * @param {string} [req.body.birth_date] - The dog's birth date
 * @param {number} [req.body.weight_kg] - The dog's weight in kg
 * @returns {Object} 201 - The created dog object
 */
router.post('/', createDogRules, validate, async (req, res, next) => {
  try {
    const { name, breed, birth_date, weight_kg } = req.body;
    const dog = await dogQueries.create({
      userId: req.user.userId,
      name,
      breed,
      birthDate: birth_date,
      weightKg: weight_kg,
    });
    res.status(201).json({ success: true, data: dog });
  } catch (err) {
    next(err);
  }
});

/**
 * Get a single dog's details with its 5 most recent events.
 *
 * @route GET /api/dogs/:id
 * @param {string} req.params.id - The dog's UUID
 * @returns {Object} 200 - Dog object with recent_events
 */
router.get('/:id', async (req, res, next) => {
  try {
    const dog = await verifyOwnership(req.params.id, req.user.userId, res);
    if (!dog) return;

    const recentEvents = await eventQueries.findRecentByDogId(dog.id);
    res.json({ success: true, data: { ...dog, recent_events: recentEvents } });
  } catch (err) {
    next(err);
  }
});

/**
 * Update a dog's information (partial update allowed).
 *
 * @route PUT /api/dogs/:id
 * @param {string} req.params.id - The dog's UUID
 * @returns {Object} 200 - The updated dog object
 */
router.put('/:id', updateDogRules, validate, async (req, res, next) => {
  try {
    const dog = await verifyOwnership(req.params.id, req.user.userId, res);
    if (!dog) return;

    const allowedFields = ['name', 'breed', 'birth_date', 'weight_kg'];
    const fields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields[key] = req.body[key];
      }
    }

    const updated = await dogQueries.update(dog.id, fields);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Upload or replace a dog's photo.
 *
 * @route POST /api/dogs/:id/photo
 * @param {string} req.params.id - The dog's UUID
 * @returns {Object} 200 - The updated dog object with new photo_url
 */
router.post('/:id/photo', upload.single('photo'), async (req, res, next) => {
  try {
    const dog = await verifyOwnership(req.params.id, req.user.userId, res);
    if (!dog) return;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid image file provided', code: 'VALIDATION_ERROR' },
      });
    }

    // Delete old photo from disk if it exists
    if (dog.photo_url) {
      const oldPath = path.join(__dirname, '../../', dog.photo_url);
      fs.unlink(oldPath, () => {});
    }

    const photoUrl = `/uploads/dogs/${req.file.filename}`;
    const updated = await dogQueries.update(dog.id, { photo_url: photoUrl });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete a dog and all its associated events.
 *
 * @route DELETE /api/dogs/:id
 * @param {string} req.params.id - The dog's UUID
 * @returns {Object} 200 - Success confirmation
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const dog = await verifyOwnership(req.params.id, req.user.userId, res);
    if (!dog) return;

    // Delete photo from disk if it exists
    if (dog.photo_url) {
      const photoPath = path.join(__dirname, '../../', dog.photo_url);
      fs.unlink(photoPath, () => {});
    }

    await dogQueries.remove(dog.id);
    res.json({ success: true, data: { message: 'Dog deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

// Mount event sub-routes
const eventRoutes = require('./events');
router.use('/:dogId/events', eventRoutes);

module.exports = router;
