/**
 * PS Store Deal Hunter - Exchange Rate Service
 * Fetches live exchange rates from Frankfurter API with fallback to demo rates.
 * Caches rates for 1 hour to minimize API calls.
 */

const DEMO_RATES = {
  PEN: 3.75,
  USD: 1,
  TRY: 34.5,
  ARS: 950,
  BRL: 5.10,
  MXN: 17.5,
  CLP: 950,
  COP: 4100,
  INR: 84,
  GBP: 0.79,
  UAH: 41.5,
};

let cachedRates = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from Frankfurter API, falling back to DEMO_RATES on failure.
 * Results are cached for 1 hour.
 * @returns {Promise<Object>} Rates object keyed by currency code (per 1 USD).
 */
async function fetchRates() {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return cachedRates;
  }

  try {
    const currencies = Object.keys(DEMO_RATES).filter(c => c !== 'USD').join(',');
    
    // Try multiple exchange rate APIs as fallbacks
    const apis = [
      `https://api.frankfurter.app/latest?base=USD&symbols=${currencies}`,
      `https://open.er-api.com/v6/latest/USD`,
    ];

    let data = null;
    for (const url of apis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) {
          const json = await response.json();
          // Normalize: frankfurter uses .rates, open.er-api uses .rates too
          if (json.rates) {
            data = json;
            console.log(`✅ Exchange rates fetched from ${url.split('/')[2]}`);
            break;
          }
        }
      } catch (_) {
        // Try next API
      }
    }

    if (!data) throw new Error('All exchange rate APIs failed');

    // Merge fetched rates with USD = 1
    cachedRates = { USD: 1 };
    for (const [currency] of Object.entries(DEMO_RATES)) {
      if (currency !== 'USD' && data.rates[currency]) {
        cachedRates[currency] = data.rates[currency];
      } else if (currency !== 'USD') {
        cachedRates[currency] = DEMO_RATES[currency]; // fallback
      }
    }

    cacheTimestamp = now;
    return cachedRates;
  } catch (error) {
    console.warn('⚠️  Failed to fetch live exchange rates, using demo rates:', error.message);
    cachedRates = { ...DEMO_RATES };
    cacheTimestamp = now;
    return cachedRates;
  }
}

/**
 * Convert an amount in local currency to USD.
 * @param {number} amount - Amount in local currency.
 * @param {string} currency - Currency code (e.g. 'PEN').
 * @returns {number} Equivalent amount in USD.
 */
function convertToUSD(amount, currency) {
  if (!cachedRates) {
    // Use demo rates as fallback if rates haven't been fetched yet
    const rate = DEMO_RATES[currency] || 1;
    return amount / rate;
  }
  const rate = cachedRates[currency] || 1;
  return amount / rate;
}

/**
 * Convert an amount in USD to local currency.
 * @param {number} amountUSD - Amount in USD.
 * @param {string} currency - Target currency code (e.g. 'PEN').
 * @returns {number} Equivalent amount in local currency.
 */
function convertFromUSD(amountUSD, currency) {
  if (!cachedRates) {
    const rate = DEMO_RATES[currency] || 1;
    return amountUSD * rate;
  }
  const rate = cachedRates[currency] || 1;
  return amountUSD * rate;
}

/**
 * Get the currently cached rates (or demo rates if not yet fetched).
 * @returns {Object} Rates object keyed by currency code.
 */
function getRates() {
  return cachedRates || { ...DEMO_RATES };
}

module.exports = { fetchRates, convertToUSD, convertFromUSD, getRates };
