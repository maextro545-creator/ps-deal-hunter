/**
 * PS Store Deal Hunter - Local Scrape Tool
 *
 * Runs the scraper locally using the home IP (which is not blocked by Akamai)
 * and uploads the real deals data directly to the Vercel KV Redis database.
 */

'use strict';

// Load environment variables from .env
require('dotenv').config();

// Enforce live mode for the scrape tool
process.env.MODE = 'live';

const exchangeService = require('./exchange-service');
const psnService = require('./psn-service');
const cacheService = require('./cache-service');

async function runLocalScrape() {
  console.log('🎮 PS Store Deal Hunter - Local Scraper Starting...');
  
  // 1. Fetch Exchange Rates
  console.log('💱 Fetching exchange rates...');
  let rates;
  try {
    rates = await exchangeService.fetchRates();
    console.log('✅ Exchange rates ready');
  } catch (err) {
    console.error('❌ Failed to fetch exchange rates:', err.message);
    process.exit(1);
  }

  // 2. Fetch Previous Deals from Vercel KV
  console.log('🔄 Fetching previous deals from Vercel KV to preserve fallback cache...');
  let previousDeals = [];
  try {
    const cached = await cacheService.get('deals');
    if (cached && Array.isArray(cached)) {
      previousDeals = cached;
      console.log(`✅ Loaded ${previousDeals.length} previous deals from cache`);
    } else {
      console.log('ℹ️ No previous deals found in cache');
    }
  } catch (err) {
    console.warn('⚠️ Could not load previous deals:', err.message);
  }

  // 3. Scrape Live PS Store
  console.log('🌐 Scraping PlayStation Store (this takes ~30-40 seconds)...');
  try {
    const deals = await psnService.getDeals(rates, previousDeals);
    
    if (deals.length === 0) {
      console.error('❌ Scraper returned 0 deals');
      process.exit(1);
    }
    
    // 4. Save to Cache
    console.log('💾 Saving scraped deals to Vercel KV...');
    const saveSuccess = await cacheService.set('deals', deals);
    if (saveSuccess) {
      console.log('💾 Saving scrape metadata status...');
      await cacheService.set('status', {
        success: true,
        message: 'Scrape completed successfully via Local Scraper',
        games: deals.length,
        lastUpdated: new Date().toISOString()
      });
      console.log(`🎉 SUCCESS! Saved ${deals.length} deals to Vercel KV database`);
    } else {
      console.error('❌ Failed to save deals to Vercel KV cache');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Scrape failed:', err.message);
    process.exit(1);
  }

  console.log('👋 Scrape process completed. Exiting.');
  process.exit(0);
}

runLocalScrape();
