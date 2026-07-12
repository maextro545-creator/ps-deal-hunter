/**
 * PS Store Deal Hunter - PSN Live Scraper Service
 *
 * Scrapes real-time prices from the PlayStation Store by parsing the
 * __NEXT_DATA__ JSON embedded in product search result pages.
 * No authentication token required – fully anonymous.
 *
 * Strategy:
 *   For each game in GAME_CATALOG, fetch the PS Store search page for all
 *   11 regions in parallel. Parse Apollo cache state from __NEXT_DATA__,
 *   find the best matching product (full-game, standard edition), and
 *   extract price + discount info. Exchange rates are used to normalise
 *   every price to USD for comparison.
 */

'use strict';

const { REGIONS } = require('./regions');
const { generateDemoDeals } = require('./demo-data');

// ─── Game Catalog ────────────────────────────────────────────────────────────────
// Each entry has the display name, search term(s), and visual metadata.

const GAME_CATALOG = [
  {
    id: 'god-of-war-ragnarok',
    name: "God of War Ragnarök",
    searchTerm: 'God of War Ragnarok',
    platform: 'PS5/PS4',
    genre: 'Acción/Aventura',
    publisher: 'Santa Monica Studio',
    rating: 4.9,
    gradient: 'linear-gradient(135deg, #1a1a4e, #4a1942)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/yU3GlRb3WTf7jVrNb3Yajbml.png',
  },
  {
    id: 'spider-man-2',
    name: "Marvel's Spider-Man 2",
    searchTerm: "Spider-Man 2",
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Insomniac Games',
    rating: 4.8,
    gradient: 'linear-gradient(135deg, #8b0000, #1a1a4e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/60aca5a43cd978eb0f9e22d5eb21e83d2f2948e6de85109d.png',
  },
  {
    id: 'ff7-rebirth',
    name: 'Final Fantasy VII Rebirth',
    searchTerm: 'Final Fantasy VII Rebirth',
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'Square Enix',
    rating: 4.7,
    gradient: 'linear-gradient(135deg, #0a2342, #2d6a4f)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202309/1320/3b50e4d98a0b3344a83bfe6f25c6c37bd0b6d236ae5a6d18.png',
  },
  {
    id: 'horizon-fw',
    name: 'Horizon Forbidden West',
    searchTerm: 'Horizon Forbidden West',
    platform: 'PS5/PS4',
    genre: 'Acción/RPG',
    publisher: 'Guerrilla Games',
    rating: 4.6,
    gradient: 'linear-gradient(135deg, #ff6b35, #1a472a)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202107/3100/HO8vkO9pfLhUkAtEpQJni5tQ.png',
  },
  {
    id: 'tlou2-remastered',
    name: 'The Last of Us Part II Remastered',
    searchTerm: 'Last of Us Part II',
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Naughty Dog',
    rating: 4.8,
    gradient: 'linear-gradient(135deg, #2d3436, #636e72)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202309/2809/7e12566b35f7a944df2bb9a1e73a2b75764f1bca4dba9de2.png',
  },
  {
    id: 'gran-turismo-7',
    name: 'Gran Turismo 7',
    searchTerm: 'Gran Turismo 7',
    platform: 'PS5/PS4',
    genre: 'Carreras',
    publisher: 'Polyphony Digital',
    rating: 4.5,
    gradient: 'linear-gradient(135deg, #0652DD, #1B1464)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202109/1321/kh4MiqkjGDmkYBMbMPECGXLU.png',
  },
  {
    id: 'returnal',
    name: 'Returnal',
    searchTerm: 'Returnal',
    platform: 'PS5',
    genre: 'Roguelike/Shooter',
    publisher: 'Housemarque',
    rating: 4.6,
    gradient: 'linear-gradient(135deg, #0c0c1d, #3d1f5c)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202010/0915/nNTEuVv1eCmBGRHx2E5YXLmR.png',
  },
  {
    id: 'ratchet-clank',
    name: 'Ratchet & Clank: Rift Apart',
    searchTerm: 'Ratchet Clank Rift Apart',
    platform: 'PS5',
    genre: 'Platformer',
    publisher: 'Insomniac Games',
    rating: 4.7,
    gradient: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202101/2921/okDLpfJVGRQ6HBFMFdG6HnkJ.png',
  },
  {
    id: 'demons-souls',
    name: "Demon's Souls",
    searchTerm: "Demon's Souls",
    platform: 'PS5',
    genre: 'Acción/RPG',
    publisher: 'Bluepoint Games',
    rating: 4.7,
    gradient: 'linear-gradient(135deg, #2c3e50, #4a4a4a)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202010/0915/t2rDzMgB2P6gCJqJ3k76q2TE.png',
  },
  {
    id: 'stellar-blade',
    name: 'Stellar Blade',
    searchTerm: 'Stellar Blade',
    platform: 'PS5',
    genre: 'Acción',
    publisher: 'SHIFT UP',
    rating: 4.5,
    gradient: 'linear-gradient(135deg, #c0c0ff, #2d2d5e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202312/2219/4440d8e4c9a28986b7b44e37b30c0640571e3a2bbf6bbff4.png',
  },
  {
    id: 'ghost-tsushima',
    name: "Ghost of Tsushima Director's Cut",
    searchTerm: 'Ghost of Tsushima',
    platform: 'PS5/PS4',
    genre: 'Acción/Aventura',
    publisher: 'Sucker Punch',
    rating: 4.9,
    gradient: 'linear-gradient(135deg, #b71540, #0c2461)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202106/1704/8RSUoqECmJF2Z3k1mEnIVAHM.png',
  },
  {
    id: 'astro-bot',
    name: 'Astro Bot',
    searchTerm: 'Astro Bot',
    platform: 'PS5',
    genre: 'Platformer',
    publisher: 'Team Asobi',
    rating: 4.8,
    gradient: 'linear-gradient(135deg, #00b4d8, #0077b6)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202405/1621/b39a47f3d5da25e0dcf5f8f27d9b4e9f5d6d39d8d3e4e3c7.png',
  },
  {
    id: 'elden-ring',
    name: 'Elden Ring',
    searchTerm: 'Elden Ring',
    platform: 'PS5/PS4',
    genre: 'Acción/RPG',
    publisher: 'FromSoftware',
    rating: 4.9,
    gradient: 'linear-gradient(135deg, #b8860b, #1a1a2e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/aGhoS6zrgi9BXFMnFbDiRwnn.png',
  },
  {
    id: 'baldurs-gate-3',
    name: "Baldur's Gate 3",
    searchTerm: "Baldur's Gate 3",
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'Larian Studios',
    rating: 4.9,
    gradient: 'linear-gradient(135deg, #5c0a0a, #2d1b00)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2321/76a32d4ba34a6f6af32f4fccee97c42893c7d0ca8e6a0ae3.png',
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    searchTerm: 'Cyberpunk 2077',
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'CD Projekt Red',
    rating: 4.5,
    gradient: 'linear-gradient(135deg, #fcee09, #00f0ff, #1a1a2e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202011/0718/iyWT5J5CJQ6RjmCNKDnIxDJ1.png',
  },
  {
    id: 'hogwarts-legacy',
    name: 'Hogwarts Legacy',
    searchTerm: 'Hogwarts Legacy',
    platform: 'PS5/PS4',
    genre: 'Acción/RPG',
    publisher: 'Avalanche Software',
    rating: 4.6,
    gradient: 'linear-gradient(135deg, #2c1810, #8b6914)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202209/1514/HcaGpBaDSNQRLFgGNOyMhRdM.png',
  },
  {
    id: 're4-remake',
    name: 'Resident Evil 4',
    searchTerm: 'Resident Evil 4',
    platform: 'PS5/PS4',
    genre: 'Horror/Acción',
    publisher: 'Capcom',
    rating: 4.8,
    gradient: 'linear-gradient(135deg, #1a0a0a, #4a0e0e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202209/0818/Gy4yG7fhxHxgWm6JpMGWbh7Y.png',
  },
  {
    id: 'street-fighter-6',
    name: 'Street Fighter 6',
    searchTerm: 'Street Fighter 6',
    platform: 'PS5/PS4',
    genre: 'Pelea',
    publisher: 'Capcom',
    rating: 4.6,
    gradient: 'linear-gradient(135deg, #ff6600, #cc0000)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202209/1622/hCJYRbN3beMcCJgBfLN4b7fi.png',
  },
  {
    id: 'death-stranding-dc',
    name: "Death Stranding Director's Cut",
    searchTerm: "Death Stranding",
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Kojima Productions',
    rating: 4.4,
    gradient: 'linear-gradient(135deg, #0a0a0a, #1a1a3e)',
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202107/2314/GVbMcEYTnhwD68Eg9BXkRGSf.png',
  },
  {
    id: 'stray',
    name: 'Stray',
    searchTerm: 'Stray',
    platform: 'PS5/PS4',
    genre: 'Aventura',
    publisher: 'BlueTwelve Studio',
    rating: 4.6,
    imageUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202204/0416/B3Jm1lFVuWjVFoBJNaZ0dfbz.png',
  },
];

// ─── Price Parsing ───────────────────────────────────────────────────────────────

/**
 * Parse a localized price string into a numeric value.
 * Handles US/UK dot-decimal, European comma-decimal, free indicators.
 * @param {string} priceStr  e.g. "US$59.99", "1.499,00 TL", "Gratis"
 * @param {string} storeCurrency  e.g. "USD", "TRY", "BRL"
 * @returns {number}  numeric value (e.g. 59.99 or 1499)
 */
function parsePriceString(priceStr, storeCurrency) {
  if (!priceStr) return 0;
  // Collapse whitespace (including non-breaking spaces)
  let str = priceStr.replace(/[\u00A0\xa0\s]+/g, '').toLowerCase().trim();

  // Free games
  if (['free', 'gratis', 'gratuito', 'ücretsiz', 'безкоштовно'].some(w => str.includes(w))) {
    return 0;
  }

  // Strip currency symbols and letters
  str = str.replace(/[a-z$£€₹₺₴rs]+/g, '');

  // Currencies where comma = decimal separator (e.g. TRY "1.499,00" → 1499)
  const commaDecimal = ['TRY', 'BRL', 'UAH', 'EUR'];
  if (commaDecimal.includes(storeCurrency)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // US / UK / India style – comma = thousands separator
    str = str.replace(/,/g, '');
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

// ─── Product Matching ────────────────────────────────────────────────────────────

/**
 * From a list of Apollo-cache products, find the best match for a game name.
 * Preference: FULL_GAME + not deluxe/ultimate/bundle → any FULL_GAME match.
 */
function findBestProduct(products, searchTerm) {
  const cleanSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').trim();
  const searchWords = cleanSearch.split(/\s+/);

  // Classifications that represent the actual full game
  const GAME_CLASSIFICATIONS = new Set([
    'full_game', 'FULL_GAME', 'game', 'GAME'
  ]);
  // Classification substrings to accept (localized)
  const GAME_STRINGS = ['full game', 'juego completo', 'vollständiges spiel', 'jogo completo', 'jeu complet', 'полная игра'];

  // Non-game classifications to explicitly reject
  const REJECT_STRINGS = ['add_on', 'addon', 'level', 'costume', 'season_pass', 'character', 'item', 'map', 'theme', 'avatar', 'other', 'premium_edition', 'game_bundle'];

  const score = (p) => {
    if (!p.name) return 0;

    const n = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').trim();
    const classification = (p.classification || '').toLowerCase().replace('_', ' ');

    // Reject non-game content outright
    if (REJECT_STRINGS.some(r => classification.includes(r))) return 0;

    // Must be a full game
    const isFullGame = GAME_CLASSIFICATIONS.has(p.classification) ||
                       GAME_STRINGS.some(g => classification.includes(g));

    // The product name must contain ALL key words from our search term
    const allWordsMatch = searchWords.every(w => n.includes(w));
    if (!allWordsMatch) return 0;

    // Prefer standard editions (not deluxe/ultimate/premium)
    const isStandard = !['deluxe', 'ultimate', 'premium edition', 'upgrade', 'bundle', 'directors cut'].some(k => n.includes(k));

    if (isFullGame && isStandard) return 3;
    if (isFullGame) return 2;
    return 1;
  };

  const scored = products
    .map(p => ({ p, s: score(p) }))
    .filter(x => x.s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      // Among equal scores prefer shorter names (closer match)
      return (a.p.name || '').length - (b.p.name || '').length;
    });

  return scored[0]?.p || null;
}

// ─── Store Page Scraping ─────────────────────────────────────────────────────────

const USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const SCRAPE_TIMEOUT_MS = 15000;

/**
 * Scrape the PS Store search page for one region and one game.
 * Returns pricing info or an error.
 */
async function scrapeRegionPrice(region, searchTerm) {
  const locale = region.language.toLowerCase();
  const url = `https://store.playstation.com/${locale}/search/${encodeURIComponent(searchTerm)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    clearTimeout(timer);

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) return { success: false, error: '__NEXT_DATA__ not found' };

    const apolloState = JSON.parse(match[1]).props?.apolloState;
    if (!apolloState) return { success: false, error: 'apolloState missing' };

    // Build product list from cache keys
    const products = Object.entries(apolloState)
      .filter(([k, v]) => v.__typename === 'Product' || k.startsWith('Product:'))
      .map(([, v]) => ({
        id: v.id,
        name: v.name,
        classification: v.storeDisplayClassification || v.localizedStoreDisplayClassification,
        price: v.price ? {
          base: v.price.basePrice,
          discounted: v.price.discountedPrice,
          isFree: v.price.isFree,
        } : null,
        media: v.media || (v.personalizedMeta?.media) || null,
      }));

    const best = findBestProduct(products, searchTerm);
    if (!best) return { success: false, error: 'No matching product found' };
    if (!best.price) return { success: false, error: 'No price info' };

    const baseVal = parsePriceString(best.price.base, region.storeCurrency);
    const discVal = parsePriceString(best.price.discounted, region.storeCurrency);
    const effectiveVal = (discVal > 0 && discVal < baseVal) ? discVal : baseVal;

    const locale = region.language.toLowerCase();
    const storeUrl = best.id
      ? `https://store.playstation.com/${locale}/product/${best.id}`
      : `https://store.playstation.com/${locale}/search/${encodeURIComponent(searchTerm)}`;

    // Extract dynamic image URL from best product media
    const masterMedia = Array.isArray(best.media)
      ? (best.media.find(m => m.role === 'MASTER' && m.type === 'IMAGE') || 
         best.media.find(m => m.type === 'IMAGE') || 
         best.media[0])
      : null;
    const imageUrl = masterMedia?.url || null;

    return {
      success: true,
      productId: best.id,
      productName: best.name,
      storeUrl,
      imageUrl,
      priceStr: best.price.discounted || best.price.base,
      priceValue: effectiveVal,
      originalPriceStr: best.price.base,
      originalPriceValue: baseVal,
      storeCurrency: region.storeCurrency,
      isSale: discVal > 0 && discVal < baseVal,
      discountPercent: baseVal > 0 ? Math.round((1 - effectiveVal / baseVal) * 100) : 0,
    };
  } catch (err) {
    if (err.name === 'AbortError') return { success: false, error: 'Timeout' };
    return { success: false, error: err.message };
  }
}

// ─── Build Deal Object ───────────────────────────────────────────────────────────

/**
 * Fetch prices for one game across all 11 regions in parallel.
 * Converts all prices to USD for cross-region comparison.
 */
async function buildDeal(gameInfo, exchangeRates) {
  const scrapePromises = REGIONS.map(async (region) => {
    const result = await scrapeRegionPrice(region, gameInfo.searchTerm);
    return { region, result };
  });

  const scrapeResults = await Promise.allSettled(scrapePromises);

  const prices = [];
  let anySuccess = false;

  for (const settled of scrapeResults) {
    if (settled.status !== 'fulfilled') continue;
    const { region, result } = settled.value;

    if (!result.success) {
      // Still include region but as unavailable
      prices.push({
        regionCode: region.code,
        regionName: region.name,
        emoji: region.emoji,
        available: false,
        priceStr: 'N/A',
        priceValue: null,
        priceUSD: null,
        effectivePriceUSD: null,
        originalPriceStr: 'N/A',
        originalPriceUSD: null,
        isSale: false,
        discountPercent: 0,
      });
      continue;
    }

    anySuccess = true;

    // Convert to USD
    const rate = exchangeRates[result.storeCurrency] || 1;
    const effectivePriceUSD = result.storeCurrency === 'USD'
      ? result.priceValue
      : result.priceValue / rate;
    const originalPriceUSD = result.storeCurrency === 'USD'
      ? result.originalPriceValue
      : result.originalPriceValue / rate;

    prices.push({
      regionCode: region.code,
      regionName: region.name,
      emoji: region.emoji,
      available: true,
      priceStr: result.priceStr,
      priceValue: result.priceValue,
      priceUSD: parseFloat(effectivePriceUSD.toFixed(2)),
      effectivePriceUSD: parseFloat(effectivePriceUSD.toFixed(2)),
      originalPriceStr: result.originalPriceStr,
      originalPriceUSD: parseFloat(originalPriceUSD.toFixed(2)),
      isSale: result.isSale,
      discountPercent: result.discountPercent,
      storeCurrency: result.storeCurrency,
      storeUrl: result.storeUrl,
    });
  }

  if (!anySuccess) return null;

  // Sort prices by USD value ascending
  const availablePrices = prices.filter(p => p.available && p.effectivePriceUSD !== null);
  availablePrices.sort((a, b) => a.effectivePriceUSD - b.effectivePriceUSD);

  const bestPrice = availablePrices[0] || null;
  const homePrice = prices.find(p => p.regionCode === 'PE') || null;

  // Overall discount %: use the max across regions (or best price's discount)
  const maxDiscount = Math.max(0, ...prices.map(p => p.discountPercent || 0));
  const onSale = maxDiscount > 0;

  // Savings vs home price
  let savingsVsHome = 0;
  if (homePrice?.effectivePriceUSD > 0 && bestPrice) {
    savingsVsHome = parseFloat(
      ((homePrice.effectivePriceUSD - bestPrice.effectivePriceUSD) / homePrice.effectivePriceUSD * 100).toFixed(1)
    );
  }

  // Find first successfully scraped image URL from regions
  const scrapedImageUrl = scrapeResults
    .filter(sr => sr.status === 'fulfilled' && sr.value.result?.success && sr.value.result?.imageUrl)
    .map(sr => sr.value.result.imageUrl)[0];

  return {
    id: gameInfo.id,
    name: gameInfo.name,
    platform: gameInfo.platform,
    genre: gameInfo.genre,
    publisher: gameInfo.publisher,
    rating: gameInfo.rating,
    gradient: gameInfo.gradient,
    imageUrl: scrapedImageUrl || gameInfo.imageUrl,
    onSale,
    discountPercent: maxDiscount,
    bestPrice,
    prices,
    savingsVsHome: Math.max(0, savingsVsHome),
    // Best store URL (cheapest region)
    bestStoreUrl: bestPrice?.storeUrl || null,
    // Legacy fields for demo-data compatibility
    releaseDate: gameInfo.releaseDate || '2022-01-01',
    basePriceUSD: bestPrice?.originalPriceUSD || bestPrice?.effectivePriceUSD || 0,
  };
}

// ─── Main Live Fetcher ───────────────────────────────────────────────────────────

/**
 * Fetch live deal data for all games in the catalog.
 * Games are fetched in batches to avoid overwhelming the PS Store.
 * Falls back to demo data for any game that fails to scrape.
 *
 * @param {Object} exchangeRates  Exchange rates (per 1 USD).
 * @returns {Promise<Array>}      Array of deal objects.
 */
async function fetchLiveDeals(exchangeRates, previousDeals = []) {
  const BATCH_SIZE = 1; // max concurrent game fetches (11 regional requests)
  const results = [];

  for (let i = 0; i < GAME_CATALOG.length; i += BATCH_SIZE) {
    const batch = GAME_CATALOG.slice(i, i + BATCH_SIZE);
    console.log(`  📡 Scraping batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(GAME_CATALOG.length / BATCH_SIZE)} (${batch.map(g => g.name).join(', ')})`);

    const batchResults = await Promise.allSettled(
      batch.map(game => buildDeal(game, exchangeRates))
    );

    batchResults.forEach((settled, idx) => {
      const game = batch[idx];
      if (settled.status === 'fulfilled' && settled.value) {
        results.push(settled.value);
      } else {
        console.warn(`  ⚠️ Game "${game.name}" failed to scrape.`);
        const prev = previousDeals.find(d => d.id === game.id);
        if (prev) {
          console.log(`  🔄 Using previously cached prices for "${game.name}"`);
          results.push(prev);
        } else {
          console.log(`  ❌ No cached data for "${game.name}" - skipping`);
        }
      }
    });

    // Small delay between batches to be polite to PS servers
    if (i + BATCH_SIZE < GAME_CATALOG.length) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  console.log(`  ✅ Scraped/recovered ${results.length}/${GAME_CATALOG.length} games`);
  return results;
}

// ─── Exports ─────────────────────────────────────────────────────────────────────

/**
 * Get all deals across all regions.
 * In live mode, scrapes real PS Store data. Falls back to demo data on failure.
 * In demo mode, uses generateDemoDeals with seeded randomization.
 *
 * @param {Object} exchangeRates  Exchange rates keyed by currency code (per 1 USD).
 * @returns {Promise<Array>}      Array of deal objects with full regional pricing.
 */
async function getDeals(exchangeRates, previousDeals = []) {
  const mode = (process.env.MODE || 'demo').trim();

  if (mode === 'live') {
    try {
      console.log('🌐 Live mode: scraping PlayStation Store...');
      const deals = await fetchLiveDeals(exchangeRates, previousDeals);
      if (deals.length === 0) {
        console.warn('⚠️  Live scrape returned 0 games; falling back to demo data');
        return generateDemoDeals(exchangeRates);
      }
      return deals;
    } catch (err) {
      console.error('❌ Live scrape failed:', err.message, '– falling back to demo data');
      return generateDemoDeals(exchangeRates);
    }
  }

  return generateDemoDeals(exchangeRates);
}

/**
 * Search games by name (case-insensitive partial match).
 * Searches the in-memory cachedDeals supplied from the calling context.
 *
 * @param {string} query         Search query string.
 * @param {Array}  cachedDeals   Current deals array.
 * @returns {Array}              Filtered deals.
 */
function searchGames(query, cachedDeals) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return cachedDeals.filter(deal =>
    deal.name.toLowerCase().includes(q) ||
    (deal.genre || '').toLowerCase().includes(q) ||
    (deal.publisher || '').toLowerCase().includes(q)
  );
}

module.exports = { getDeals, searchGames, GAME_CATALOG };
