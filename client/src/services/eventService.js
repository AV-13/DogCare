import { api } from './api';

/**
 * Fetch all events for a dog, optionally filtered by type.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} [type] - Optional event type filter
 * @returns {Promise<Object>} Response with array of events
 */
export const getEvents = (dogId, type) => {
  const query = type ? `?type=${type}` : '';
  return api.get(`/dogs/${dogId}/events${query}`);
};

/**
 * Create a new event for a dog.
 *
 * @param {string} dogId - The dog's UUID
 * @param {Object} data - Event data
 * @returns {Promise<Object>} Response with the created event
 */
export const createEvent = (dogId, data) => api.post(`/dogs/${dogId}/events`, data);

/**
 * Update an existing event.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} eventId - The event's UUID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Response with the updated event
 */
export const updateEvent = (dogId, eventId, data) =>
  api.put(`/dogs/${dogId}/events/${eventId}`, data);

/**
 * Delete an event.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} eventId - The event's UUID
 * @returns {Promise<Object>} Success response
 */
export const deleteEvent = (dogId, eventId) =>
  api.delete(`/dogs/${dogId}/events/${eventId}`);

/**
 * Fetch calendar events for a dog in a specific month.
 *
 * @param {string} dogId - The dog's UUID
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Object>} Response with events grouped by day
 */
export const getCalendar = (dogId, month) =>
  api.get(`/dogs/${dogId}/events/calendar?month=${month}`);

/**
 * Fetch paginated history of past events for a dog.
 *
 * @param {string} dogId - The dog's UUID
 * @param {number} [page=1] - Page number
 * @param {number} [limit=20] - Items per page
 * @returns {Promise<Object>} Paginated response with events and pagination metadata
 */
export const getHistory = (dogId, page = 1, limit = 20) =>
  api.get(`/dogs/${dogId}/events/history?page=${page}&limit=${limit}`);
