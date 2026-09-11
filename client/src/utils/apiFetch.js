/**
 * apiFetch.js — authenticated fetch wrapper
 *
 * Automatically attaches the JWT from localStorage as an Authorization header
 * on every request, so individual components don't need to manage it.
 *
 * Usage:
 *   import { apiFetch } from '../../utils/apiFetch.js';
 *
 *   // GET
 *   const data = await apiFetch('/api/cases').then(r => r.json());
 *
 *   // POST with JSON body
 *   const res = await apiFetch('/api/claims', {
 *     method: 'POST',
 *     body: JSON.stringify(payload),
 *   });
 *
 *   // POST with FormData (file upload) — don't set Content-Type, let the
 *   // browser set it automatically with the correct boundary
 *   const res = await apiFetch('/api/upload', { method: 'POST', body: formData });
 *
 * The base URL comes from VITE_API_URL (falling back to '').
 * The function returns the raw Response so callers can inspect .ok, call
 * .json(), etc., just like native fetch.
 */

const BASE = import.meta.env.VITE_API_URL || '';

/**
 * @param {string} path   API path, e.g. '/api/cases'
 * @param {RequestInit} [options]  Standard fetch options
 * @returns {Promise<Response>}
 */
export function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token') || '';

  const headers = new Headers(options.headers || {});

  // Attach the JWT — skip if there's no token (e.g. login call)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // For JSON payloads, add Content-Type automatically if not already set
  // and the body is a string (JSON.stringify output).
  if (
    typeof options.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  // For FormData (file uploads), do NOT set Content-Type — let the browser
  // set it with the multipart boundary.

  return fetch(`${BASE}${path}`, { ...options, headers });
}
