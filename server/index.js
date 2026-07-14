/**
 * PS Store Deal Hunter - Express Server
 * Main entry point. Serves the API and static frontend files.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { REGIONS } = require('./regions');
const { fetchRates, getRates } = require('./exchange-service');
const { getDeals, searchGames, searchAndScrapeGame, searchAndScrapeGamesList, scrapeCategoryDealsList } = require('./psn-service');
const { generateDemoDeals } = require('./demo-data');
const cache = require('./cache-service');

// ─── Configuration ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const REFRESH_INTERVAL = (process.env.REFRESH_INTERVAL || 30) * 60 * 1000; // minutes → ms
const MODE = (process.env.MODE || 'demo').trim();

// ─── State ──────────────────────────────────────────────────────────────────────

let cachedDeals = [];
let lastUpdated = null;

// ─── Express App ────────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Cache & Initialization ─────────────────────────────────────────────────────

let initPromise = null;

async function ensureInitialized() {
  if (cachedDeals.length > 0) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('🔄 Attempting to load deals from persistent cache...');
        const cached = await cache.get('deals');
        const rates = await cache.get('rates');
        const status = await cache.get('status');

        if (cached && cached.length > 0) {
          cachedDeals = cached;
          lastUpdated = status?.lastUpdated ? new Date(status.lastUpdated) : new Date();
          console.log(`✅ Loaded ${cachedDeals.length} deals from persistent cache`);
        } else {
          // Cache is empty (e.g. first run). Load demo data instantly
          console.warn('⚠️ Persistent cache is empty. Loading demo data fallback.');
          const ratesData = rates || getRates();
          cachedDeals = generateDemoDeals(ratesData);
          lastUpdated = new Date();

          // Trigger background refresh so it populates live data without blocking client
          refreshData().catch(err => console.error('❌ Background refresh failed:', err.message));
        }
      } catch (err) {
        console.error('❌ Error during initialization:', err.message);
      } finally {
        initPromise = null;
      }
    })();
  }
  return initPromise;
}

// Middleware: ensure cache is hydrated before handling API requests
app.use('/api', async (req, res, next) => {
  await ensureInitialized();
  next();
});

// ─── API Endpoints ──────────────────────────────────────────────────────────────

/**
 * GET /api/cron-scrape
 * Triggered by Vercel Cron Jobs to scrape PlayStation Store in the background.
 * Protected by Vercel's Cron Secret in production.
 */
app.get('/api/cron-scrape', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET ? process.env.CRON_SECRET.trim() : null;
  const authHeader = req.headers.authorization;

  // Accept token from header or query param
  const token = req.query.secret || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

  // Verify Cron Secret in production
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (!token || token !== cronSecret) {
      console.warn('⚠️ Unauthorized cron scrape attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('⏰ Cron Scrape triggered...');

  try {
    await refreshData();
    res.json({
      success: true,
      message: 'Scrape completed successfully',
      games: cachedDeals.length,
      lastUpdated: lastUpdated.toISOString()
    });
  } catch (err) {
    console.error('❌ Cron scrape failed:', err);
    res.status(500).json({ error: 'Scrape failed', message: err.message });
  }
});

/**
 * GET /api/deals
 * Returns all deals with optional filtering and sorting.
 */
app.get('/api/deals', (req, res) => {
  try {
    let deals = [...cachedDeals];

    // Filter: on-sale only
    if (req.query.onSale === 'true') {
      deals = deals.filter(d => d.onSale);
    }

    // Filter: by platform
    if (req.query.platform) {
      const platform = req.query.platform.toUpperCase();
      deals = deals.filter(d => d.platform.includes(platform));
    }

    // Filter: by genre
    if (req.query.genre) {
      const genre = req.query.genre.toLowerCase();
      deals = deals.filter(d => d.genre.toLowerCase().includes(genre));
    }

    // Sort
    const sortBy = req.query.sort || 'name';
    switch (sortBy) {
      case 'price':
        deals.sort((a, b) => (a.bestPrice?.effectivePriceUSD || 0) - (b.bestPrice?.effectivePriceUSD || 0));
        break;
      case 'discount':
        deals.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case 'rating':
        deals.sort((a, b) => b.rating - a.rating);
        break;
      case 'savings':
        deals.sort((a, b) => b.savingsVsHome - a.savingsVsHome);
        break;
      case 'name':
      default:
        deals.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Compute meta stats
    const onSaleCount = cachedDeals.filter(d => d.onSale).length;

    // Find cheapest region on average
    const regionTotals = {};
    const regionCounts = {};
    for (const deal of cachedDeals) {
      for (const price of deal.prices) {
        if (!regionTotals[price.regionCode]) {
          regionTotals[price.regionCode] = 0;
          regionCounts[price.regionCode] = 0;
        }
        regionTotals[price.regionCode] += price.effectivePriceUSD;
        regionCounts[price.regionCode]++;
      }
    }

    const regionAverages = Object.entries(regionTotals).map(([code, total]) => ({
      code,
      avg: total / (regionCounts[code] || 1),
    }));
    regionAverages.sort((a, b) => a.avg - b.avg);

    const cheapestRegionCode = regionAverages[0]?.code;
    const mostExpensiveRegionCode = regionAverages[regionAverages.length - 1]?.code;

    const cheapestRegionInfo = REGIONS.find(r => r.code === cheapestRegionCode);
    const mostExpensiveRegionInfo = REGIONS.find(r => r.code === mostExpensiveRegionCode);

    // Calculate average savings for cheapest region vs home
    const homeRegion = REGIONS.find(r => r.isHome);
    const homeCode = homeRegion?.code || 'PE';
    const homeAvg = regionTotals[homeCode] / (regionCounts[homeCode] || 1);
    const cheapAvg = regionAverages[0]?.avg || homeAvg;
    const avgSavings = homeAvg > 0
      ? Math.round(((homeAvg - cheapAvg) / homeAvg) * 100)
      : 0;

    res.json({
      deals,
      meta: {
        total: cachedDeals.length,
        onSale: onSaleCount,
        lastUpdated: lastUpdated?.toISOString() || null,
        mode: MODE,
        cheapestRegion: cheapestRegionInfo
          ? { code: cheapestRegionInfo.code, name: cheapestRegionInfo.name, emoji: cheapestRegionInfo.emoji, avgSavings }
          : null,
        mostExpensiveRegion: mostExpensiveRegionInfo
          ? { code: mostExpensiveRegionInfo.code, name: mostExpensiveRegionInfo.name, emoji: mostExpensiveRegionInfo.emoji }
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Error serving deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals', message: error.message });
  }
});

/**
 * GET /api/deals/category
 * Returns live scraped deals for a specific category ID and page from PS Store,
 * grouped across all regions.
 */
app.get('/api/deals/category', async (req, res) => {
  try {
    const categoryId = req.query.id || 'd1fa27b1-da1f-4c4b-8e7a-997e59b787f7';
    const page = parseInt(req.query.page) || 1;

    // Use a cache key for category + page
    const cacheKey = `category-deals:${categoryId}:${page}`;
    let deals = [];
    let cached = false;

    // Bypass cache if refresh=true
    const bypassCache = req.query.refresh === 'true';

    if (!bypassCache) {
      try {
        const cachedData = await cache.get(cacheKey);
        if (cachedData && Array.isArray(cachedData)) {
          console.log(`✅ Loaded category deals from cache for: "${categoryId}" page ${page}`);
          deals = cachedData;
          cached = true;
        }
      } catch (err) {
        console.warn(`⚠️ Error reading category cache: ${err.message}`);
      }
    }

    if (!cached || deals.length === 0) {
      const rates = getRates();
      deals = await scrapeCategoryDealsList(categoryId, page, rates);

      if (deals && deals.length > 0) {
        // Cache for 6 hours (21600 seconds)
        try {
          await cache.set(cacheKey, deals, 21600);
          console.log(`💾 Saved category deals to Redis cache for: "${categoryId}" page ${page}`);
        } catch (err) {
          console.warn(`⚠️ Error caching category: ${err.message}`);
        }
      }
    }

    res.json({
      deals,
      meta: {
        categoryId,
        page,
        total: deals.length,
        cached
      }
    });
  } catch (error) {
    console.error('❌ Error getting category deals:', error);
    res.status(500).json({ error: 'Failed to fetch category deals', message: error.message });
  }
});

/**
 * GET /api/search
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Missing search query parameter "q"' });
    }

    // 1. Find local matches in cachedDeals memory
    const localResults = searchGames(query, cachedDeals);

    // 2. Clean query to create a safe cache key
    const cleanQuery = query.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const cacheKey = `search-game-list:${cleanQuery}`;

    // 3. Try to fetch from Redis KV cache (unless refresh=true is requested)
    let liveResults = [];
    let cached = false;
    const bypassCache = req.query.refresh === 'true';

    if (!bypassCache) {
      try {
        const cachedResult = await cache.get(cacheKey);
        if (cachedResult && Array.isArray(cachedResult)) {
          console.log(`✅ Loaded search list results from cache for: "${query}"`);
          liveResults = cachedResult;
          cached = true;
        }
      } catch (err) {
        console.warn(`⚠️ Error reading search cache: ${err.message}`);
      }
    } else {
      console.log(`🔄 Cache bypass requested for search list: "${query}"`);
    }

    // 4. Run live scraper search if not found in cache
    if (!cached || liveResults.length === 0) {
      const rates = getRates();
      liveResults = await searchAndScrapeGamesList(query, rates);

      if (liveResults && liveResults.length > 0) {
        // Save to cache with 1 day TTL (86400 seconds)
        try {
          await cache.set(cacheKey, liveResults, 86400);
          console.log(`💾 Saved search list results to Redis cache for: "${query}"`);
        } catch (err) {
          console.warn(`⚠️ Error saving search to cache: ${err.message}`);
        }
      }
    }

    // 5. Merge results (avoiding duplicates)
    const results = [...localResults];
    if (liveResults && liveResults.length > 0) {
      liveResults.forEach(liveDeal => {
        if (!results.some(r => r.id === liveDeal.id)) {
          results.push(liveDeal);
        }
      });
    }

    res.json({
      results,
      meta: {
        query,
        total: results.length,
        cached
      },
    });
  } catch (error) {
    console.error('❌ Error searching games:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

/**
 * GET /api/regions
 */
app.get('/api/regions', (req, res) => {
  res.json({ regions: REGIONS });
});

/**
 * GET /api/rates
 */
app.get('/api/rates', (req, res) => {
  res.json({ rates: getRates(), base: 'USD' });
});

/**
 * GET /api/status
 */
app.get('/api/status', (req, res) => {
  res.json({
    mode: MODE,
    lastUpdated: lastUpdated?.toISOString() || null,
    totalGames: cachedDeals.length,
    regionsActive: REGIONS.length,
    refreshInterval: REFRESH_INTERVAL / 60000,
  });
});

// ─── Fallback: serve index.html for SPA routing ─────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Data Refresh ───────────────────────────────────────────────────────────────

async function refreshData() {
  try {
    console.log('🔄 Refreshing deal data...');
    const rates = await fetchRates();
    const deals = await getDeals(rates, cachedDeals);

    cachedDeals = deals;
    lastUpdated = new Date();

    // Save to persistent cache
    await cache.set('deals', deals);
    await cache.set('rates', rates);
    await cache.set('status', {
      lastUpdated: lastUpdated.toISOString(),
      mode: MODE,
      totalGames: deals.length,
    });

    console.log(`✅ Data refreshed: ${deals.length} games across ${REGIONS.length} regions and saved to persistent cache`);
  } catch (error) {
    console.error('❌ Error refreshing data:', error);
    throw error;
  }
}

// ─── Export for Vercel serverless ────────────────────────────────────────────────

module.exports = app;

// ─── Server Startup (local dev only) ────────────────────────────────────────────

if (require.main === module) {
  async function startServer() {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🎮  PS STORE DEAL HUNTER  🎮                               ║
    ║                                                              ║
    ║   Compare PlayStation game prices across 11 regions          ║
    ║   Find the cheapest deals worldwide                          ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);

    console.log(`⚙️  Mode: ${MODE}`);
    console.log(`🔄 Refresh interval: ${REFRESH_INTERVAL / 60000} minutes`);
    console.log(`🌍 Regions: ${REGIONS.length}`);

    // Initial data hydration
    await ensureInitialized();

    // Schedule periodic refresh for local development
    setInterval(refreshData, REFRESH_INTERVAL);

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api/deals`);
      console.log(`🔍 Search at http://localhost:${PORT}/api/search?q=god+of+war`);
      console.log('');
    });
  }

  startServer().catch(error => {
    console.error('💥 Fatal error starting server:', error);
    process.exit(1);
  });
}
