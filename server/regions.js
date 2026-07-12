/**
 * PS Store Deal Hunter - Regions Configuration
 * Defines all supported PlayStation Store regions with currency and locale info.
 * storeCurrency = the actual currency the PS Store charges in for that region.
 */

const REGIONS = [
  { code: 'PE', name: 'Perú',          emoji: '🇵🇪', currency: 'PEN', storeCurrency: 'USD', currencySymbol: 'US$', language: 'es-PE', isHome: true  },
  { code: 'US', name: 'Estados Unidos', emoji: '🇺🇸', currency: 'USD', storeCurrency: 'USD', currencySymbol: '$',   language: 'en-US', isHome: false },
  { code: 'TR', name: 'Turquía',        emoji: '🇹🇷', currency: 'TRY', storeCurrency: 'TRY', currencySymbol: '₺',   language: 'tr-TR', isHome: false },
  { code: 'AR', name: 'Argentina',      emoji: '🇦🇷', currency: 'ARS', storeCurrency: 'USD', currencySymbol: 'US$', language: 'es-AR', isHome: false },
  { code: 'BR', name: 'Brasil',         emoji: '🇧🇷', currency: 'BRL', storeCurrency: 'BRL', currencySymbol: 'R$',  language: 'pt-BR', isHome: false },
  { code: 'MX', name: 'México',         emoji: '🇲🇽', currency: 'MXN', storeCurrency: 'USD', currencySymbol: 'US$', language: 'es-MX', isHome: false },
  { code: 'CL', name: 'Chile',          emoji: '🇨🇱', currency: 'CLP', storeCurrency: 'USD', currencySymbol: 'US$', language: 'es-CL', isHome: false },
  { code: 'CO', name: 'Colombia',       emoji: '🇨🇴', currency: 'COP', storeCurrency: 'USD', currencySymbol: 'US$', language: 'es-CO', isHome: false },
  { code: 'IN', name: 'India',          emoji: '🇮🇳', currency: 'INR', storeCurrency: 'INR', currencySymbol: '₹',   language: 'en-IN', isHome: false },
  { code: 'GB', name: 'Reino Unido',    emoji: '🇬🇧', currency: 'GBP', storeCurrency: 'GBP', currencySymbol: '£',   language: 'en-GB', isHome: false },
  { code: 'UA', name: 'Ucrania',        emoji: '🇺🇦', currency: 'UAH', storeCurrency: 'UAH', currencySymbol: '₴',   language: 'uk-UA', isHome: false },
];

module.exports = { REGIONS };
