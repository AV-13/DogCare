const express = require('express');
const { createEventRules, updateEventRules } = require('../validators/events');
const validate = require('../validators/validate');
const dogQueries = require('../db/queries/dogs');
const eventQueries = require('../db/queries/events');

// mergeParams allows access to :dogId from the parent router
const router = express.Router({ mergeParams: true });

/**
 * Middleware that verifies the dog exists and belongs to the authenticated user.
 * Attaches `req.dog` on success.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyDogOwnership = async (req, res, next) => {
  try {
    const dog = await dogQueries.findById(req.params.dogId);
    if (!dog) {
      return res.status(404).json({
        success: false,
        error: { message: 'Dog not found', code: 'NOT_FOUND' },
      });
    }
    if (dog.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied', code: 'FORBIDDEN' },
      });
    }
    req.dog = dog;
    next();
  } catch (err) {
    next(err);
  }
};

router.use(verifyDogOwnership);

/**
 * Get events for a dog's calendar view, grouped by day.
 *
 * @route GET /api/dogs/:dogId/events/calendar
 * @param {string} req.query.month - Month in YYYY-MM format
 * @returns {Object} 200 - Events grouped by date string
 */
router.get('/calendar', async (req, res, next) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Month parameter is required (YYYY-MM)', code: 'VALIDATION_ERROR' },
      });
    }

    const startDate = `${month}-01T00:00:00.000Z`;
    const [year, mon] = month.split('-').map(Number);
    const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`;
    const endDate = `${nextMonth}-01T00:00:00.000Z`;

    const events = await eventQueries.findByMonth(req.dog.id, startDate, endDate);

    // Group events by day
    const grouped = {};
    for (const event of events) {
      const day = new Date(event.event_date).toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    }

    res.json({ success: true, data: grouped });
  } catch (err) {
    next(err);
  }
});

/**
 * Get paginated history of past events for a dog.
 *
 * @route GET /api/dogs/:dogId/events/history
 * @param {string} [req.query.page=1] - Page number
 * @param {string} [req.query.limit=20] - Items per page (max 100)
 * @returns {Object} 200 - Paginated event list with pagination metadata
 */
router.get('/history', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { rows, total } = await eventQueries.findHistory(req.dog.id, limit, offset);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List all events for a dog, optionally filtered by type.
 *
 * @route GET /api/dogs/:dogId/events
 * @param {string} [req.query.type] - Filter by event type
 * @returns {Object} 200 - Array of event objects
 */
router.get('/', async (req, res, next) => {
  try {
    const events = await eventQueries.findByDogId(req.dog.id, req.query.type);
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * Create a new event for a dog.
 *
 * @route POST /api/dogs/:dogId/events
 * @param {string} req.body.type - Event type (vaccine, walk, meal, vet)
 * @param {string} req.body.title - Event title
 * @param {string} [req.body.description] - Event description
 * @param {string} req.body.event_date - Event date (ISO 8601)
 * @param {string} [req.body.next_due_date] - Next due date (vaccines only)
 * @returns {Object} 201 - The created event object
 */
router.post('/', createEventRules, validate, async (req, res, next) => {
  try {
    const { type, title, description, event_date, next_due_date } = req.body;
    const event = await eventQueries.create({
      dogId: req.dog.id,
      type,
      title,
      description,
      eventDate: event_date,
      nextDueDate: next_due_date,
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * Update an existing event (type cannot be changed).
 *
 * @route PUT /api/dogs/:dogId/events/:eventId
 * @param {string} req.params.eventId - The event's UUID
 * @returns {Object} 200 - The updated event object
 */
router.put('/:eventId', updateEventRules, validate, async (req, res, next) => {
  try {
    const event = await eventQueries.findById(req.params.eventId);
    if (!event || event.dog_id !== req.dog.id) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found', code: 'NOT_FOUND' },
      });
    }

    const allowedFields = ['title', 'description', 'event_date', 'next_due_date'];
    const fields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        fields[key] = req.body[key];
      }
    }

    const updated = await eventQueries.update(event.id, fields);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete an event.
 *
 * @route DELETE /api/dogs/:dogId/events/:eventId
 * @param {string} req.params.eventId - The event's UUID
 * @returns {Object} 200 - Success confirmation
 */
router.delete('/:eventId', async (req, res, next) => {
  try {
    const event = await eventQueries.findById(req.params.eventId);
    if (!event || event.dog_id !== req.dog.id) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found', code: 'NOT_FOUND' },
      });
    }

    await eventQueries.remove(event.id);
    res.json({ success: true, data: { message: 'Event deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
