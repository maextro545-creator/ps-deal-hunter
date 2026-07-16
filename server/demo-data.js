/**
 * PS Store Deal Hunter - Demo Data
 * Contains 20 realistic PlayStation games and logic to generate
 * region-specific pricing using seeded randomization for consistency.
 */

const { REGIONS } = require('./regions');

// ─── 20 PlayStation Games ───────────────────────────────────────────────────────

const DEMO_GAMES = [
  {
    id: 'god-of-war-ragnarok',
    name: 'God of War Ragnarök',
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Santa Monica Studio',
    rating: 4.9,
    releaseDate: '2022-11-09',
    basePriceUSD: 69.99,
    onSale: true,
    discountPercent: 40,
    gradient: 'linear-gradient(135deg, #1a1a4e, #4a1942)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/ee/God_of_War_Ragnar%C3%B6k_cover.jpg',
  },
  {
    id: 'spider-man-2',
    name: "Marvel's Spider-Man 2",
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Insomniac Games',
    rating: 4.8,
    releaseDate: '2023-10-20',
    basePriceUSD: 69.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #8b0000, #1a1a4e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e1/Spider-Man_2_key_art.jpg',
  },
  {
    id: 'ff7-rebirth',
    name: 'Final Fantasy VII Rebirth',
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'Square Enix',
    rating: 4.7,
    releaseDate: '2024-02-29',
    basePriceUSD: 69.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #0a2342, #2d6a4f)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/15/Final_Fantasy_VII_Rebirth_cover.jpg',
  },
  {
    id: 'horizon-fw',
    name: 'Horizon Forbidden West Complete',
    platform: 'PS5/PS4',
    genre: 'Acción/RPG',
    publisher: 'Guerrilla Games',
    rating: 4.6,
    releaseDate: '2022-02-18',
    basePriceUSD: 59.99,
    onSale: true,
    discountPercent: 60,
    gradient: 'linear-gradient(135deg, #ff6b35, #1a472a)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Horizon_Forbidden_West_cover_art.jpg',
  },
  {
    id: 'tlou2-remastered',
    name: 'The Last of Us Part II Remastered',
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Naughty Dog',
    rating: 4.8,
    releaseDate: '2024-01-19',
    basePriceUSD: 49.99,
    onSale: true,
    discountPercent: 30,
    gradient: 'linear-gradient(135deg, #2d3436, #636e72)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4f/TLOU_Part_II_cover_art.png',
  },
  {
    id: 'gran-turismo-7',
    name: 'Gran Turismo 7',
    platform: 'PS5/PS4',
    genre: 'Carreras',
    publisher: 'Polyphony Digital',
    rating: 4.5,
    releaseDate: '2022-03-04',
    basePriceUSD: 69.99,
    onSale: true,
    discountPercent: 50,
    gradient: 'linear-gradient(135deg, #0652DD, #1B1464)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/Gran_Turismo_7_cover_art.jpg',
  },
  {
    id: 'returnal',
    name: 'Returnal',
    platform: 'PS5',
    genre: 'Roguelike/Shooter',
    publisher: 'Housemarque',
    rating: 4.6,
    releaseDate: '2021-04-30',
    basePriceUSD: 69.99,
    onSale: true,
    discountPercent: 55,
    gradient: 'linear-gradient(135deg, #0c0c1d, #3d1f5c)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Returnal_cover_art.jpg',
  },
  {
    id: 'ratchet-clank',
    name: 'Ratchet & Clank: Rift Apart',
    platform: 'PS5',
    genre: 'Platformer',
    publisher: 'Insomniac Games',
    rating: 4.7,
    releaseDate: '2021-06-11',
    basePriceUSD: 69.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5e/Ratchet_%26_Clank_-_Rift_Apart_cover_art.png',
  },
  {
    id: 'demons-souls',
    name: "Demon's Souls",
    platform: 'PS5',
    genre: 'Acción/RPG',
    publisher: 'Bluepoint Games',
    rating: 4.7,
    releaseDate: '2020-11-12',
    basePriceUSD: 69.99,
    onSale: true,
    discountPercent: 45,
    gradient: 'linear-gradient(135deg, #2c3e50, #4a4a4a)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/03/Demon%27s_Souls_PS5_cover_art.jpg',
  },
  {
    id: 'stellar-blade',
    name: 'Stellar Blade',
    platform: 'PS5',
    genre: 'Acción',
    publisher: 'SHIFT UP',
    rating: 4.5,
    releaseDate: '2024-04-26',
    basePriceUSD: 69.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #c0c0ff, #2d2d5e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/ad/Stellar_Blade_cover_art.jpg',
  },
  {
    id: 'ghost-tsushima',
    name: "Ghost of Tsushima Director's Cut",
    platform: 'PS5/PS4',
    genre: 'Acción/Aventura',
    publisher: 'Sucker Punch',
    rating: 4.9,
    releaseDate: '2021-08-20',
    basePriceUSD: 59.99,
    onSale: true,
    discountPercent: 50,
    gradient: 'linear-gradient(135deg, #b71540, #0c2461)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b6/Ghost_of_Tsushima.jpg',
  },
  {
    id: 'astro-bot',
    name: 'Astro Bot',
    platform: 'PS5',
    genre: 'Platformer',
    publisher: 'Team Asobi',
    rating: 4.8,
    releaseDate: '2024-09-06',
    basePriceUSD: 59.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #00b4d8, #0077b6)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/bd/Astro_Bot_cover_art.jpg',
  },
  {
    id: 'elden-ring',
    name: 'Elden Ring',
    platform: 'PS5/PS4',
    genre: 'Acción/RPG',
    publisher: 'FromSoftware',
    rating: 4.9,
    releaseDate: '2022-02-25',
    basePriceUSD: 59.99,
    onSale: true,
    discountPercent: 40,
    gradient: 'linear-gradient(135deg, #b8860b, #1a1a2e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
  },
  {
    id: 'baldurs-gate-3',
    name: "Baldur's Gate 3",
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'Larian Studios',
    rating: 4.9,
    releaseDate: '2023-09-06',
    basePriceUSD: 69.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #5c0a0a, #2d1b00)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/1/12/Baldur%27s_Gate_3_cover_art.jpg',
  },
  {
    id: 'cyberpunk-2077',
    name: 'Cyberpunk 2077 Ultimate',
    platform: 'PS5',
    genre: 'RPG',
    publisher: 'CD Projekt Red',
    rating: 4.5,
    releaseDate: '2023-09-26',
    basePriceUSD: 49.99,
    onSale: true,
    discountPercent: 65,
    gradient: 'linear-gradient(135deg, #fcee09, #00f0ff, #1a1a2e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Cyberpunk_2077_box_art.jpg',
  },
  {
    id: 'hogwarts-legacy',
    name: 'Hogwarts Legacy',
    platform: 'PS5',
    genre: 'Acción/RPG',
    publisher: 'Avalanche Software',
    rating: 4.6,
    releaseDate: '2023-02-10',
    basePriceUSD: 59.99,
    onSale: true,
    discountPercent: 50,
    gradient: 'linear-gradient(135deg, #2c1810, #8b6914)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Hogwarts_Legacy_cover_art.jpg',
  },
  {
    id: 're4-remake',
    name: 'Resident Evil 4 Remake',
    platform: 'PS5/PS4',
    genre: 'Horror/Acción',
    publisher: 'Capcom',
    rating: 4.8,
    releaseDate: '2023-03-24',
    basePriceUSD: 59.99,
    onSale: true,
    discountPercent: 50,
    gradient: 'linear-gradient(135deg, #1a0a0a, #4a0e0e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d7/Resident_Evil_4_Remake_cover_art.jpg',
  },
  {
    id: 'street-fighter-6',
    name: 'Street Fighter 6',
    platform: 'PS5/PS4',
    genre: 'Pelea',
    publisher: 'Capcom',
    rating: 4.6,
    releaseDate: '2023-06-02',
    basePriceUSD: 59.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #ff6600, #cc0000)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/52/Street_Fighter_6_cover_art.jpg',
  },
  {
    id: 'death-stranding-dc',
    name: "Death Stranding Director's Cut",
    platform: 'PS5',
    genre: 'Acción/Aventura',
    publisher: 'Kojima Productions',
    rating: 4.4,
    releaseDate: '2021-09-24',
    basePriceUSD: 49.99,
    onSale: true,
    discountPercent: 70,
    gradient: 'linear-gradient(135deg, #0a0a0a, #1a1a3e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Death_Stranding_cover_art.jpg',
  },
  {
    id: 'stray',
    name: 'Stray',
    platform: 'PS5/PS4',
    genre: 'Aventura',
    publisher: 'BlueTwelve Studio',
    rating: 4.6,
    releaseDate: '2022-07-19',
    basePriceUSD: 29.99,
    onSale: false,
    discountPercent: 0,
    gradient: 'linear-gradient(135deg, #ff9a3c, #1a0a2e)',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Stray_cover_art.jpg',
  },
];

// ─── Regional Price Multipliers (relative to US price) ──────────────────────────

const REGIONAL_PRICE_MULTIPLIERS = {
  PE: { min: 0.98, max: 1.08 },
  US: { min: 1.00, max: 1.00 },
  TR: { min: 0.45, max: 0.60 },
  AR: { min: 0.50, max: 0.65 },
  BR: { min: 0.82, max: 0.95 },
  MX: { min: 1.02, max: 1.15 },
  CL: { min: 0.78, max: 0.90 },
  CO: { min: 0.88, max: 1.00 },
  IN: { min: 0.60, max: 0.75 },
  GB: { min: 1.05, max: 1.20 },
  UA: { min: 0.55, max: 0.68 },
};

// ─── Seeded Random ──────────────────────────────────────────────────────────────

/**
 * Simple string hash for deterministic seeded randomization.
 * Produces a number between 0 and 1 based on the input seed string.
 * @param {string} seed - Seed string (e.g. 'god-of-war-ragnarok-TR').
 * @returns {number} Pseudo-random number between 0 and 1.
 */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Normalize to 0–1 range
  const positive = Math.abs(hash);
  return (positive % 10000) / 10000;
}

/**
 * Round a price to a "nice" number based on currency conventions.
 * Whole numbers for CLP/COP/ARS, 2 decimal places for others.
 * @param {number} price - The raw calculated price.
 * @param {string} currency - The currency code.
 * @returns {number} The rounded price.
 */
function roundPrice(price, currency) {
  const wholeNumberCurrencies = ['CLP', 'COP', 'ARS'];
  if (wholeNumberCurrencies.includes(currency)) {
    // Round to nearest 10 for large-number currencies
    return Math.round(price / 10) * 10;
  }
  return Math.round(price * 100) / 100;
}

/**
 * Generate demo deals for all games across all regions.
 * Uses seeded randomization so results are deterministic per game+region combo.
 *
 * @param {Object} exchangeRates - Object mapping currency codes to rates per 1 USD.
 * @returns {Array<Object>} Array of deal objects with region-specific pricing.
 */
function generateDemoDeals(exchangeRates) {
  const deals = [];

  for (const game of DEMO_GAMES) {
    const regionPrices = [];

    for (const region of REGIONS) {
      const multiplierRange = REGIONAL_PRICE_MULTIPLIERS[region.code];
      if (!multiplierRange) continue;

      // Deterministic multiplier based on game id + region code
      const rand = seededRandom(`${game.id}-${region.code}`);
      const multiplier = multiplierRange.min + rand * (multiplierRange.max - multiplierRange.min);

      // Exchange rate for this region's currency
      const rate = exchangeRates[region.currency] || 1;

      // Calculate local original price
      const rawOriginalLocal = game.basePriceUSD * multiplier * rate;
      const originalPrice = roundPrice(rawOriginalLocal, region.currency);

      // Calculate sale price if applicable
      let salePrice = null;
      if (game.onSale && game.discountPercent > 0) {
        const rawSaleLocal = rawOriginalLocal * (1 - game.discountPercent / 100);
        salePrice = roundPrice(rawSaleLocal, region.currency);
      }

      // Convert back to USD for comparison
      const originalPriceUSD = Math.round((originalPrice / rate) * 100) / 100;
      const salePriceUSD = salePrice !== null
        ? Math.round((salePrice / rate) * 100) / 100
        : null;
      const effectivePriceUSD = salePriceUSD !== null ? salePriceUSD : originalPriceUSD;

      regionPrices.push({
        regionCode: region.code,
        regionName: region.name,
        emoji: region.emoji,
        currency: region.currency,
        currencySymbol: region.currencySymbol,
        originalPrice,
        salePrice,
        originalPriceUSD,
        salePriceUSD,
        effectivePriceUSD,
        isHome: region.isHome,
      });
    }

    // Determine best, worst, and home prices
    const sorted = [...regionPrices].sort((a, b) => a.effectivePriceUSD - b.effectivePriceUSD);
    const bestPrice = sorted[0]
      ? { regionCode: sorted[0].regionCode, effectivePriceUSD: sorted[0].effectivePriceUSD }
      : null;
    const worstPrice = sorted[sorted.length - 1]
      ? { regionCode: sorted[sorted.length - 1].regionCode, effectivePriceUSD: sorted[sorted.length - 1].effectivePriceUSD }
      : null;

    const homeRegionPrice = regionPrices.find(p => p.isHome);
    const homePrice = homeRegionPrice
      ? { regionCode: homeRegionPrice.regionCode, effectivePriceUSD: homeRegionPrice.effectivePriceUSD }
      : null;

    // Calculate savings vs home
    let savingsVsHome = 0;
    if (homePrice && bestPrice && homePrice.effectivePriceUSD > 0) {
      savingsVsHome = Math.round(
        ((homePrice.effectivePriceUSD - bestPrice.effectivePriceUSD) / homePrice.effectivePriceUSD) * 1000
      ) / 10;
    }

    const createdAt = Date.now() - (i % 3 === 0 ? 4 * 60 * 60 * 1000 : 5 * 24 * 60 * 60 * 1000);
    const saleDetectedAt = game.onSale ? (i % 2 === 0 ? Date.now() - 4 * 60 * 60 * 1000 : Date.now() - 5 * 24 * 60 * 60 * 1000) : null;

    deals.push({
      id: game.id,
      name: game.name,
      platform: game.platform,
      genre: game.genre,
      publisher: game.publisher,
      rating: game.rating,
      releaseDate: game.releaseDate,
      gradient: game.gradient,
      imageUrl: game.imageUrl,
      onSale: game.onSale,
      discountPercent: game.discountPercent,
      prices: regionPrices,
      bestPrice,
      worstPrice,
      homePrice,
      savingsVsHome,
      createdAt,
      saleDetectedAt,
    });
  }

  return deals;
}

module.exports = { DEMO_GAMES, REGIONAL_PRICE_MULTIPLIERS, generateDemoDeals };
