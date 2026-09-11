/**
 * env.js — MUST be the first import in server.js
 *
 * In ESM, all `import` statements are hoisted and evaluated before any
 * top-level code runs. This means calling `dotenv.config()` in server.js
 * after the import block is too late — other modules (e.g. middleware/auth.js)
 * have already executed and read process.env.
 *
 * By placing dotenv.config() in its own module and importing it first,
 * we guarantee .env is loaded before every other module initialises.
 */
import dotenv from 'dotenv';

dotenv.config();
