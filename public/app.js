/* ═══════════════════════════════════════════════════════════════
   PS Deal Hunter — Frontend Application
   ═══════════════════════════════════════════════════════════════ */

// ── State ────────────────────────────────────────────────────────
let state = {
  deals: [],
  regions: [],
  rates: {},
  status: {},
  meta: {},
  filters: {
    search: '',
    onSale: false,
    platform: 'all',
    sort: 'price'
  },
  selectedGame: null,
  loading: true
};

let refreshInterval = null;
let searchDebounceTimer = null;

// ── DOM References ───────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  dealsGrid: () => $('#deals-grid'),
  skeleton: () => $('#loading-skeleton'),
  emptyState: () => $('#empty-state'),
  searchInput: () => $('#search-input'),
  sortSelect: () => $('#sort-select'),
  statusMode: () => $('#status-mode'),
  statusTime: () => $('#status-time'),
  statusBadge: () => $('#status-badge'),
  statTotal: () => $('#stat-total-value'),
  statCheapest: () => $('#stat-cheapest-value'),
  statDiscount: () => $('#stat-discount-value'),
  statUpdate: () => $('#stat-update-value'),
  modal: () => $('#comparison-modal'),
  modalOverlay: () => $('#modal-overlay'),
  modalClose: () => $('#modal-close'),
  modalHeader: () => $('#modal-header'),
  modalGameName: () => $('#modal-game-name'),
  modalPlatform: () => $('#modal-platform'),
  modalGenre: () => $('#modal-genre'),
  modalRating: () => $('#modal-rating'),
  priceTableBody: () => $('#price-table-body'),
  barChart: () => $('#bar-chart'),
  savingsSummary: () => $('#savings-summary')
};


// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);

async function init() {
  showLoading();
  setupFilters();
  setupKeyboardShortcuts();

  await fetchData();

  hideLoading();
  renderStats(state.meta);
  renderDeals(state.deals);
  updateStatusBadge();

  // Auto-refresh every 5 minutes
  refreshInterval = setInterval(async () => {
    await fetchData();
    renderStats(state.meta);
    renderDeals(state.deals);
    updateStatusBadge();
  }, 5 * 60 * 1000);
}


// ═══════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════

async function fetchData() {
  try {
    const [dealsRes, regionsRes, ratesRes, statusRes] = await Promise.all([
      fetch('/api/deals?sort=price').then(r => r.json()),
      fetch('/api/regions').then(r => r.json()),
      fetch('/api/rates').then(r => r.json()),
      fetch('/api/status').then(r => r.json())
    ]);

    state.deals = dealsRes.deals || [];
    state.meta = dealsRes.meta || {};
    state.regions = regionsRes.regions || [];
    state.rates = ratesRes.rates || {};
    state.status = statusRes || {};
    state.loading = false;
  } catch (err) {
    console.error('Error fetching data:', err);
    state.loading = false;
  }
}


// ═══════════════════════════════════════════════════════════════
// RENDERING — STATS
// ═══════════════════════════════════════════════════════════════

function renderStats(meta) {
  if (!meta) return;

  // Total offers
  const totalEl = DOM.statTotal();
  if (totalEl) {
    animateNumber(totalEl, meta.onSale || meta.total || 0);
  }

  // Cheapest region
  const cheapestEl = DOM.statCheapest();
  if (cheapestEl && meta.cheapestRegion) {
    cheapestEl.textContent = `${meta.cheapestRegion.emoji} ${meta.cheapestRegion.name}`;
  }

  // Max discount
  const discountEl = DOM.statDiscount();
  if (discountEl) {
    const maxDiscount = state.deals.reduce((max, d) => Math.max(max, d.discountPercent || 0), 0);
    discountEl.textContent = `${maxDiscount}%`;
  }

  // Last update
  const updateEl = DOM.statUpdate();
  if (updateEl && meta.lastUpdated) {
    updateEl.textContent = formatTimeAgo(meta.lastUpdated);
  }
}

function animateNumber(el, target) {
  const duration = 800;
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(from + (target - from) * eased);
    el.textContent = current.toLocaleString('es-PE');
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}


// ═══════════════════════════════════════════════════════════════
// RENDERING — DEALS
// ═══════════════════════════════════════════════════════════════

function renderDeals(deals) {
  const grid = DOM.dealsGrid();
  const emptyState = DOM.emptyState();
  if (!grid) return;

  // Apply filters
  let filtered = filterDeals(deals);

  // Apply sort
  filtered = sortDeals(filtered);

  // Clear grid
  grid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState && (emptyState.hidden = false);
    return;
  }

  emptyState && (emptyState.hidden = true);

  filtered.forEach((deal, i) => {
    const card = createDealCard(deal, i);
    grid.appendChild(card);
  });
}

function filterDeals(deals) {
  return deals.filter(deal => {
    // Search filter
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      const matchName = deal.name.toLowerCase().includes(q);
      const matchPublisher = (deal.publisher || '').toLowerCase().includes(q);
      const matchGenre = (deal.genre || '').toLowerCase().includes(q);
      if (!matchName && !matchPublisher && !matchGenre) return false;
    }

    // On-sale filter
    if (state.filters.onSale && !deal.onSale) return false;

    // Platform filter
    if (state.filters.platform !== 'all') {
      const plat = state.filters.platform.toUpperCase();
      if (deal.platform?.toUpperCase() !== plat) return false;
    }

    return true;
  });
}

function sortDeals(deals) {
  const sorted = [...deals];
  switch (state.filters.sort) {
    case 'price':
      sorted.sort((a, b) => (a.bestPrice?.effectivePriceUSD || 999) - (b.bestPrice?.effectivePriceUSD || 999));
      break;
    case 'discount':
      sorted.sort((a, b) => {
        // On-sale games first, then by discount descending
        if (a.onSale && !b.onSale) return -1;
        if (!a.onSale && b.onSale) return 1;
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      });
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      break;
    case 'recent':
      sorted.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      break;
  }
  return sorted;
}


// ═══════════════════════════════════════════════════════════════
// DEAL CARD CREATION
// ═══════════════════════════════════════════════════════════════

function createDealCard(deal, index) {
  const article = document.createElement('article');
  article.className = 'deal-card';
  article.dataset.id = deal.id;
  article.style.animationDelay = `${index * 0.06}s`;

  // Find emoji for best price region
  const bestRegion = state.regions.find(r => r.code === deal.bestPrice?.regionCode);
  const bestEmoji = bestRegion?.emoji || '🏆';

  // Find US price for "original price" display
  const usPrice = deal.prices?.find(p => p.regionCode === 'US');
  const originalPriceUS = usPrice?.originalPriceUSD;

  // Store URL for best deal (direct link to cheapest PS Store)
  const bestStoreUrl = deal.bestPrice?.storeUrl || deal.bestStoreUrl || null;
  const bestRegionName = bestRegion?.name || deal.bestPrice?.regionCode || '';

  // Image with fallback to gradient
  const imgId = `img-${deal.id}`;
  const fallbackGradient = deal.gradient || 'linear-gradient(135deg, #003087, #00439c)';
  const fallbackStyle = `background:${fallbackGradient}; display:flex; align-items:center; justify-content:center; font-size:3rem;`;

  // Build card HTML
  article.innerHTML = `
    <div class="card-header" id="header-${escapeHtml(deal.id)}" style="background: ${fallbackGradient}; position:relative; overflow:hidden;">
      <img
        id="${imgId}"
        src="${escapeHtml(deal.imageUrl || '')}"
        alt="${escapeHtml(deal.name)}"
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.4s;"
        onload="this.style.opacity='1'"
        onerror="this.style.display='none'"
        referrerpolicy="no-referrer"
      />
      <div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%);"></div>
      <div class="card-badges" style="position:relative;z-index:1;">
        <span class="badge-platform">${escapeHtml(deal.platform || 'PS5')}</span>
        ${deal.onSale ? `<span class="badge-sale">-${deal.discountPercent}%</span>` : ''}
      </div>
      <div class="card-title" style="position:relative;z-index:1;">
        <h3>${escapeHtml(deal.name)}</h3>
        <span class="card-genre">${escapeHtml(deal.genre || '')}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-prices">
        <div class="price-row best">
          <span class="price-label">🏆 Mejor Precio (${escapeHtml(deal.bestPrice?.regionCode || '??')} ${bestEmoji})</span>
          <span class="price-value price-best">$${(deal.bestPrice?.effectivePriceUSD || 0).toFixed(2)}</span>
        </div>
        <div class="price-row home">
          <span class="price-label">🇵🇪 Perú</span>
          <span class="price-value">$${(deal.homePrice?.effectivePriceUSD || deal.prices?.find(p=>p.regionCode==='PE')?.effectivePriceUSD || 0).toFixed(2)}</span>
        </div>
        ${deal.onSale && originalPriceUS != null ? `
          <div class="price-row original">
            <span class="price-label">Precio Original (US)</span>
            <span class="price-value price-original">$${originalPriceUS.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      ${deal.savingsVsHome > 0 ? `
        <div class="savings-badge">💰 Ahorras ${deal.savingsVsHome.toFixed(0)}% vs Perú</div>
      ` : ''}
      <div class="card-meta">
        <span class="rating">⭐ ${deal.rating || '—'}</span>
        <span class="publisher">${escapeHtml(deal.publisher || '')}</span>
      </div>
      <div class="card-actions">
        <button class="btn-compare" onclick="openComparison('${escapeHtml(deal.id)}')">Comparar Precios →</button>
        ${bestStoreUrl ? `<a class="btn-store" href="${escapeHtml(bestStoreUrl)}" target="_blank" rel="noopener" title="Ver oferta en PS Store ${bestRegionName}">🛒 Ver Oferta</a>` : ''}
      </div>
    </div>
  `;

  return article;
}


// ═══════════════════════════════════════════════════════════════
// COMPARISON MODAL
// ═══════════════════════════════════════════════════════════════

function openComparison(gameId) {
  const deal = state.deals.find(d => d.id === gameId);
  if (!deal) return;

  state.selectedGame = deal;

  // Set modal header
  DOM.modalGameName().textContent = deal.name;
  DOM.modalPlatform().textContent = deal.platform || 'PS5';
  DOM.modalGenre().textContent = deal.genre || '';
  DOM.modalRating().textContent = `⭐ ${deal.rating || '—'}`;
  DOM.modalHeader().style.backgroundImage = `linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.9) 100%), url('${deal.imageUrl || ''}')`;
  DOM.modalHeader().style.backgroundSize = 'cover';
  DOM.modalHeader().style.backgroundPosition = 'center';

  // Build price table
  const prices = [...(deal.prices || [])].sort((a, b) => a.effectivePriceUSD - b.effectivePriceUSD);
  const homePriceUSD = deal.homePrice?.effectivePriceUSD || 0;
  const cheapestCode = deal.bestPrice?.regionCode;
  const worstCode = deal.worstPrice?.regionCode;

  const tableBody = DOM.priceTableBody();
  tableBody.innerHTML = '';

  prices.forEach((p, i) => {
    const row = document.createElement('tr');

    // Row class
    if (p.regionCode === cheapestCode) row.className = 'row-best';
    else if (p.isHome) row.className = 'row-home';
    else if (p.regionCode === worstCode) row.className = 'row-worst';

    // Savings vs Peru
    let savingsPct = 0;
    if (homePriceUSD > 0) {
      savingsPct = ((homePriceUSD - p.effectivePriceUSD) / homePriceUSD) * 100;
    }

    const localPrice = formatPrice(
      p.salePrice != null ? p.salePrice : p.originalPrice,
      p.currency,
      p.currencySymbol
    );

    row.innerHTML = `
      <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem;">#${i + 1}</td>
      <td>
        <div class="region-cell">
          <span>${p.emoji || ''}</span>
          <span>${escapeHtml(p.regionName || p.regionCode)}</span>
          ${p.isHome ? '<span class="badge-platform" style="font-size: 0.6rem; padding: 2px 6px;">TUYA</span>' : ''}
        </div>
      </td>
      <td style="color: var(--text-secondary);">${localPrice}</td>
      <td class="usd-price" style="color: ${p.regionCode === cheapestCode ? 'var(--accent-green)' : p.regionCode === worstCode ? 'var(--accent-red)' : 'var(--text-primary)'};">$${p.effectivePriceUSD.toFixed(2)}</td>
      <td class="savings-cell ${savingsPct > 0 ? 'savings-positive' : savingsPct < 0 ? 'savings-negative' : ''}">
        ${savingsPct > 0 ? '↓' : savingsPct < 0 ? '↑' : '—'} ${Math.abs(savingsPct).toFixed(1)}%
      </td>
      <td>
        ${p.storeUrl ? `<a class="btn-store-mini" href="${escapeHtml(p.storeUrl)}" target="_blank" rel="noopener" title="Abrir en PS Store ${escapeHtml(p.regionName || '')}">🛒</a>` : '<span style="color:var(--text-muted);font-size:0.8rem;">—</span>'}
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Bar chart
  DOM.barChart().innerHTML = createBarChart(prices);

  // Savings summary
  renderSavingsSummary(deal, prices);

  // Show modal
  DOM.modal().hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeComparison() {
  const modal = DOM.modal();
  if (modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
    state.selectedGame = null;
  }
}


// ═══════════════════════════════════════════════════════════════
// BAR CHART
// ═══════════════════════════════════════════════════════════════

function createBarChart(prices) {
  if (!prices || prices.length === 0) return '';

  const maxPrice = Math.max(...prices.map(p => p.effectivePriceUSD));
  const minPrice = Math.min(...prices.map(p => p.effectivePriceUSD));
  const range = maxPrice - minPrice || 1;

  return prices.map(p => {
    const pct = maxPrice > 0 ? (p.effectivePriceUSD / maxPrice) * 100 : 0;
    const normalized = (p.effectivePriceUSD - minPrice) / range; // 0 = cheapest, 1 = most expensive

    // Color: green(cheapest) -> orange(mid) -> red(expensive)
    const color = priceColor(normalized);

    return `
      <div class="bar-row">
        <span class="bar-label">${p.emoji || ''} ${escapeHtml(p.regionName || p.regionCode)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${pct.toFixed(1)}%; background: ${color};"></div>
        </div>
        <span class="bar-value">$${p.effectivePriceUSD.toFixed(2)}</span>
      </div>
    `;
  }).join('');
}

function priceColor(normalized) {
  // 0 = green (#10b981), 0.5 = orange (#f59e0b), 1 = red (#ef4444)
  if (normalized <= 0.5) {
    const t = normalized * 2; // 0 to 1
    return interpolateColor([16, 185, 129], [245, 158, 11], t);
  } else {
    const t = (normalized - 0.5) * 2; // 0 to 1
    return interpolateColor([245, 158, 11], [239, 68, 68], t);
  }
}

function interpolateColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}


// ═══════════════════════════════════════════════════════════════
// SAVINGS SUMMARY
// ═══════════════════════════════════════════════════════════════

function renderSavingsSummary(deal, prices) {
  const summary = DOM.savingsSummary();
  if (!summary) return;

  const best = prices[0];
  const worst = prices[prices.length - 1];
  const home = prices.find(p => p.isHome);
  const savingsVsHome = deal.savingsVsHome || 0;

  summary.innerHTML = `
    <div class="savings-summary-item">
      <span class="savings-summary-label">🏆 Mejor Precio</span>
      <span class="savings-summary-value">${best?.emoji || ''} $${best?.effectivePriceUSD.toFixed(2) || '—'}</span>
    </div>
    <div class="savings-summary-item">
      <span class="savings-summary-label">🇵🇪 Precio en Perú</span>
      <span class="savings-summary-value" style="color: var(--accent-purple);">${home?.emoji || '🇵🇪'} $${home?.effectivePriceUSD.toFixed(2) || '—'}</span>
    </div>
    <div class="savings-summary-item">
      <span class="savings-summary-label">💰 Ahorro vs Perú</span>
      <span class="savings-summary-value">${savingsVsHome > 0 ? `${savingsVsHome.toFixed(1)}%` : 'N/A'}</span>
    </div>
    <div class="savings-summary-item">
      <span class="savings-summary-label">📊 Rango de Precios</span>
      <span class="savings-summary-value" style="color: var(--text-secondary); font-size: 0.95rem;">$${best?.effectivePriceUSD.toFixed(2) || '?'} — $${worst?.effectivePriceUSD.toFixed(2) || '?'}</span>
    </div>
  `;
}


// ═══════════════════════════════════════════════════════════════
// FILTERS & SEARCH
// ═══════════════════════════════════════════════════════════════

function setupFilters() {
  // Search input
  const searchInput = DOM.searchInput();
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.filters.search = e.target.value.trim();
        renderDeals(state.deals);
      }, 300);
    });
  }

  // Filter buttons
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Remove active from all
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply filter
      switch (filter) {
        case 'all':
          state.filters.onSale = false;
          state.filters.platform = 'all';
          break;
        case 'sale':
          state.filters.onSale = true;
          state.filters.platform = 'all';
          break;
        case 'ps5':
          state.filters.onSale = false;
          state.filters.platform = 'ps5';
          break;
        case 'ps4':
          state.filters.onSale = false;
          state.filters.platform = 'ps4';
          break;
      }

      renderDeals(state.deals);
    });
  });

  // Sort dropdown
  const sortSelect = DOM.sortSelect();
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.filters.sort = e.target.value;
      renderDeals(state.deals);
    });
  }

  // Modal close
  const modalClose = DOM.modalClose();
  if (modalClose) {
    modalClose.addEventListener('click', closeComparison);
  }

  const modalOverlay = DOM.modalOverlay();
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeComparison);
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape closes modal
    if (e.key === 'Escape') {
      closeComparison();
    }

    // Ctrl+K focuses search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = DOM.searchInput();
      if (input) input.focus();
    }
  });
}


// ═══════════════════════════════════════════════════════════════
// LOADING STATES
// ═══════════════════════════════════════════════════════════════

function showLoading() {
  const skeleton = DOM.skeleton();
  const grid = DOM.dealsGrid();
  if (skeleton) skeleton.classList.remove('hidden');
  if (grid) grid.style.display = 'none';
}

function hideLoading() {
  const skeleton = DOM.skeleton();
  const grid = DOM.dealsGrid();
  if (skeleton) skeleton.classList.add('hidden');
  if (grid) grid.style.display = '';
}


// ═══════════════════════════════════════════════════════════════
// STATUS BADGE & AUTO-REFRESH
// ═══════════════════════════════════════════════════════════════

function updateStatusBadge() {
  const badge = DOM.statusBadge();
  const modeEl = DOM.statusMode();
  const timeEl = DOM.statusTime();

  if (!badge || !modeEl || !timeEl) return;

  const mode = state.status.mode || state.meta.mode || 'DEMO';
  modeEl.textContent = mode;

  if (mode === 'LIVE') {
    badge.classList.add('live');
    badge.classList.remove('demo');
  } else {
    badge.classList.remove('live');
    badge.classList.add('demo');
  }

  const lastUpdated = state.meta.lastUpdated || state.status.lastUpdated;
  if (lastUpdated) {
    timeEl.textContent = formatTimeAgo(lastUpdated);
  }
}


// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function formatPrice(amount, currency, currencySymbol) {
  if (amount == null) return '—';

  const noCurrencySymbolCurrencies = ['CLP', 'COP', 'ARS'];

  try {
    if (noCurrencySymbolCurrencies.includes(currency)) {
      // No decimals, with thousands separator
      const formatted = new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `${currencySymbol || '$'}${formatted}`;
    }

    const formatted = new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${currencySymbol || '$'}${formatted}`;
  } catch {
    return `${currencySymbol || '$'}${amount.toFixed(2)}`;
  }
}

function formatTimeAgo(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    return rtf.format(-diffDay, 'day');
  } catch {
    return dateString || '—';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
