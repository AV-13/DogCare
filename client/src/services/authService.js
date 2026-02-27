import { api } from './api';

/**
 * Register a new user.
 *
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.first_name
 * @returns {Promise<Object>} Response with token and user data
 */
export const register = (data) => api.post('/auth/register', data);

/**
 * Log in an existing user.
 *
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.password
 * @returns {Promise<Object>} Response with token and user data
 */
export const login = (data) => api.post('/auth/login', data);
