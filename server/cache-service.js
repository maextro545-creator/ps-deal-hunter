/**
 * PS Store Deal Hunter - Cache Service
 *
 * Abstracted caching layer.
 * In production (Vercel): Uses Vercel KV (Redis) to persist data across serverless invocations.
 * In development (Local): Uses local JSON file cache (server/deals-cache.json) for fast local iteration.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LOCAL_CACHE_PATH = path.join(__dirname, 'deals-cache.json');

// Check if Vercel KV is configured (Vercel automatically injects KV_REST_API_URL when connected)
const useKV = !!(process.env.KV_REST_API_URL);

let kv = null;
if (useKV) {
  try {
    const { createClient } = require('@vercel/kv');
    kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    console.log('✅ Cache Service: Using Vercel KV (Redis) store');
  } catch (err) {
    console.error('❌ Cache Service: Failed to initialize Vercel KV:', err.message);
  }
}

if (!kv) {
  console.log('ℹ️ Cache Service: Using Local File Storage');
}

/**
 * Get cached data by key.
 * @param {string} key - Cache key (e.g. 'deals', 'rates', 'status')
 * @returns {Promise<any|null>} Cached value or null.
 */
async function get(key) {
  if (kv) {
    try {
      return await kv.get(key);
    } catch (err) {
      console.error(`❌ Cache Service: Error reading key "${key}" from KV:`, err.message);
      // Fallback to reading local file if KV fails
    }
  }

  // Local file storage fallback
  try {
    if (!fs.existsSync(LOCAL_CACHE_PATH)) return null;
    const data = JSON.parse(fs.readFileSync(LOCAL_CACHE_PATH, 'utf8'));
    return data[key] || null;
  } catch (err) {
    console.error(`❌ Cache Service: Error reading key "${key}" from local file:`, err.message);
    return null;
  }
}

/**
 * Save data to cache by key.
 * @param {string} key - Cache key (e.g. 'deals', 'rates', 'status')
 * @param {any} value - Value to serialize and save.
 * @returns {Promise<boolean>} Success status.
 */
async function set(key, value) {
  if (kv) {
    try {
      await kv.set(key, value);
      return true;
    } catch (err) {
      console.error(`❌ Cache Service: Error writing key "${key}" to KV:`, err.message);
      // Fallback to local file
    }
  }

  // Local file storage
  try {
    let data = {};
    if (fs.existsSync(LOCAL_CACHE_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(LOCAL_CACHE_PATH, 'utf8'));
      } catch (_) {
        data = {};
      }
    }
    data[key] = value;
    fs.writeFileSync(LOCAL_CACHE_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`❌ Cache Service: Error writing key "${key}" to local file:`, err.message);
    return false;
  }
}

module.exports = { get, set };
