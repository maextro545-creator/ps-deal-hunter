/**
 * PS Store Deal Hunter - Cache Service
 *
 * Abstracted caching layer.
 * In production (Vercel): Uses ioredis to connect to Vercel KV (Redis) using the TCP connection URL.
 * In development (Local): Uses local JSON file cache (server/deals-cache.json).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const LOCAL_CACHE_PATH = path.join(__dirname, 'deals-cache.json');

// Check if Vercel KV is configured (we look for KV_REDIS_URL or KV_URL)
const redisUrl = process.env.KV_REDIS_URL || process.env.KV_URL;

let kv = null;
if (redisUrl) {
  try {
    const Redis = require('ioredis');
    // Connect to Upstash Redis via TCP
    kv = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    console.log('✅ Cache Service: Using Vercel KV (ioredis) store');
  } catch (err) {
    console.error('❌ Cache Service: Failed to initialize ioredis:', err.message);
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
      const val = await kv.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.error(`❌ Cache Service: Error reading key "${key}" from KV:`, err.message);
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
      await kv.set(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`❌ Cache Service: Error writing key "${key}" to KV:`, err.message);
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
