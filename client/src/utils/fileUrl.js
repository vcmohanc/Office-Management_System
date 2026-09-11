/**
 * fileUrl.js — authenticated upload URL helper
 *
 * The /uploads route now requires a valid JWT.  Browser <a href> and <img src>
 * links can't set an Authorization header, so we append the token as a query
 * parameter instead.  The server's verifyFileToken middleware accepts either.
 *
 * Usage:
 *   import { fileUrl } from '../../utils/fileUrl';
 *   <a href={fileUrl(filename)}>Download</a>
 *   <img src={fileUrl(filename)} />
 */

/**
 * Build a token-authenticated URL for an uploaded file.
 * @param {string} filename  The stored filename (e.g. "1234567890-receipt.pdf")
 * @returns {string}  Full URL with ?token= appended
 */
export function fileUrl(filename) {
  const base = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token') || '';
  return `${base}/uploads/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}
