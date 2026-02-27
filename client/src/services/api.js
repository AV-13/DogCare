const API_BASE = '/api';

/**
 * Perform an authenticated HTTP request to the API.
 * Automatically attaches the JWT token and handles 401 redirects.
 *
 * @param {string} endpoint - The API endpoint (e.g. '/dogs')
 * @param {RequestInit} [options={}] - Fetch options
 * @returns {Promise<Object>} The parsed JSON response
 * @throws {Object} The error object from the API response
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Remove Content-Type for FormData (let browser set it with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Only redirect on 401 if we're not already on an auth page
    if (response.status === 401 && !endpoint.startsWith('/auth')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw data.error;
  }

  return data;
}

/**
 * API helper object with shorthand methods for common HTTP verbs.
 */
export const api = {
  /** @param {string} endpoint */
  get: (endpoint) => request(endpoint),

  /** @param {string} endpoint @param {Object} body */
  post: (endpoint, body) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  /** @param {string} endpoint @param {Object} body */
  put: (endpoint, body) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  /** @param {string} endpoint */
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  /**
   * Upload a file via multipart/form-data.
   *
   * @param {string} endpoint
   * @param {FormData} formData
   * @returns {Promise<Object>}
   */
  upload: (endpoint, formData) =>
    request(endpoint, { method: 'POST', body: formData }),
};
