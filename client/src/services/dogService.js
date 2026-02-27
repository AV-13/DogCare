import { api } from './api';

/**
 * Fetch all dogs belonging to the authenticated user.
 *
 * @returns {Promise<Object>} Response with array of dog objects
 */
export const getDogs = () => api.get('/dogs');

/**
 * Fetch a single dog by ID, including recent events.
 *
 * @param {string} id - The dog's UUID
 * @returns {Promise<Object>} Response with dog object and recent_events
 */
export const getDog = (id) => api.get(`/dogs/${id}`);

/**
 * Create a new dog.
 *
 * @param {Object} data - Dog data (name, breed, birth_date, weight_kg)
 * @returns {Promise<Object>} Response with the created dog
 */
export const createDog = (data) => api.post('/dogs', data);

/**
 * Update an existing dog.
 *
 * @param {string} id - The dog's UUID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Response with the updated dog
 */
export const updateDog = (id, data) => api.put(`/dogs/${id}`, data);

/**
 * Delete a dog.
 *
 * @param {string} id - The dog's UUID
 * @returns {Promise<Object>} Success response
 */
export const deleteDog = (id) => api.delete(`/dogs/${id}`);

/**
 * Upload or replace a dog's photo.
 *
 * @param {string} id - The dog's UUID
 * @param {File} file - The image file to upload
 * @returns {Promise<Object>} Response with the updated dog
 */
export const uploadPhoto = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.upload(`/dogs/${id}/photo`, formData);
};

/**
 * Fetch upcoming vaccine reminders for all dogs.
 *
 * @returns {Promise<Object>} Response with array of vaccine reminders
 */
export const getUpcomingVaccines = () => api.get('/dogs/vaccines/upcoming');
