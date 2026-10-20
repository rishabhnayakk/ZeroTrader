/**
 * Smart Indian Stock & Index Symbol Resolver
 * Normalizes user queries, cleans spaces, fixes common typos,
 * and maps to correct TradingView and Exchange symbols.
 */

export const POPULAR_ITEMS = [
  { name: 'NIFTY 50', tv: 'BSE:SETFNIF50', ticker: 'NIFTY', desc: 'Benchmark Index (Nifty 50)', type: 'INDEX' },
  { name: 'BANK NIFTY', tv: 'BSE:SETFNIFBK', ticker: 'BANKNIFTY', desc: 'Banking Sector Index', type: 'INDEX' },
  { name: 'FIN NIFTY', tv: 'NSE:FINNIFTY', ticker: 'FINNIFTY', desc: 'Financial Services Index', type: 'INDEX' },
  { name: 'BSE SENSEX', tv: 'BSE:SENSEX', ticker: 'SENSEX', desc: 'BSE Benchmark Index', type: 'INDEX' },
  { name: 'RELIANCE', tv: 'BSE:RELIANCE', ticker: 'RELIANCE', desc: 'Reliance Industries', type: 'STOCK' },
  { name: 'TCS', tv: 'BSE:TCS', ticker: 'TCS', desc: 'Tata Consultancy Services', type: 'STOCK' },
  { name: 'INFOSYS', tv: 'BSE:INFY', ticker: 'INFY', desc: 'Infosys Limited', type: 'STOCK' },
  { name: 'HDFC BANK', tv: 'BSE:HDFCBANK', ticker: 'HDFCBANK', desc: 'HDFC Bank Ltd', type: 'STOCK' },
  { name: 'ICICI BANK', tv: 'BSE:ICICIBANK', ticker: 'ICICIBANK', desc: 'ICICI Bank Ltd', type: 'STOCK' },
  { name: 'STATE BANK OF INDIA', tv: 'BSE:SBIN', ticker: 'SBIN', desc: 'SBI Banking', type: 'STOCK' },
  { name: 'TATA MOTORS', tv: 'BSE:TATAMOTORS', ticker: 'TATAMOTORS', desc: 'Tata Motors Ltd', type: 'STOCK' },
  { name: 'ITC', tv: 'BSE:ITC', ticker: 'ITC', desc: 'ITC Limited', type: 'STOCK' },
];

export function isBankNiftyMatch(raw) {
  if (!raw) return false;
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (
    s.includes('BANKNIFTY') ||
    s.includes('BAKNIFTY') ||
    s.includes('BANNIFTY') ||
    s.includes('NIFTYBANK') ||
    s.includes('BANKBEES') ||
    s === 'BANK' ||
    s === 'BN' ||
    s === 'BANK50'
  );
}

export function isFinNiftyMatch(raw) {
  if (!raw) return false;
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (
    s.includes('FINNIFTY') ||
    s.includes('NIFTYFIN') ||
    s.includes('NIFTYFINANCIAL') ||
    s === 'FIN' ||
    s === 'FINANCIAL'
  );
}

export function isNiftyMatch(raw) {
  if (!raw) return false;
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Matches typos: nofty, niftyfity, niftyfifty, nigty, nifti, nfty, nofty50, etc.
  if (['NIFTY', 'NOFTY', 'NIFTI', 'NIGTY', 'NFTY', 'NIF', 'NOF'].some((p) => s.startsWith(p))) return true;
  if (
    s.includes('NIFTY') ||
    s.includes('NOFTY') ||
    s.includes('NIFTI') ||
    s.includes('NIGTY') ||
    s.includes('NFTY') ||
    s.includes('CNX')
  ) return true;
  if (['NIFTYFIFTY', 'NIFTYFITY', 'NIFTY50', 'NOFTY50', 'NOFTYFIFTY', 'NIFTYBEES', '50'].includes(s)) return true;
  return false;
}

export function resolveSymbol(input) {
  if (!input) return { tv: 'BSE:SETFNIF50', ticker: 'NIFTY', name: 'NIFTY 50' };

  let raw = input.trim().toUpperCase().replace(/\s+/g, '');

  // Strip exchange prefix if provided
  if (raw.startsWith('NSE:')) raw = raw.replace('NSE:', '');
  if (raw.startsWith('BSE:')) raw = raw.replace('BSE:', '');

  if (isBankNiftyMatch(raw)) {
    return { tv: 'BSE:SETFNIFBK', ticker: 'BANKNIFTY', name: 'BANK NIFTY' };
  }
  if (isFinNiftyMatch(raw)) {
    return { tv: 'NSE:FINNIFTY', ticker: 'FINNIFTY', name: 'FIN NIFTY' };
  }
  if (isNiftyMatch(raw)) {
    return { tv: 'BSE:SETFNIF50', ticker: 'NIFTY', name: 'NIFTY 50' };
  }
  if (['SENSEX', 'BSESENSEX', 'BSE'].includes(raw)) {
    return { tv: 'BSE:SENSEX', ticker: 'SENSEX', name: 'BSE SENSEX' };
  }

  // Check matching popular stocks
  const found = POPULAR_ITEMS.find((item) => item.ticker === raw);
  if (found) {
    return { tv: found.tv, ticker: found.ticker, name: found.name };
  }

  // Default to BSE equity ticker
  return {
    tv: 'BSE:' + raw,
    ticker: raw,
    name: raw,
  };
}

export function searchSymbols(query) {
  if (!query || !query.trim()) return POPULAR_ITEMS.slice(0, 8);
  const q = query.trim().toUpperCase().replace(/\s+/g, '');

  const results = [];
  const addedTickers = new Set();

  // If user is searching nifty variations (e.g. nofty, niftyfity, niftyfifty)
  if (isNiftyMatch(q) && !isBankNiftyMatch(q) && !isFinNiftyMatch(q)) {
    const niftyItem = POPULAR_ITEMS.find((i) => i.ticker === 'NIFTY');
    if (niftyItem) {
      results.push(niftyItem);
      addedTickers.add(niftyItem.ticker);
    }
  }

  // If user is searching bank nifty variations
  if (isBankNiftyMatch(q)) {
    const bankItem = POPULAR_ITEMS.find((i) => i.ticker === 'BANKNIFTY');
    if (bankItem) {
      results.push(bankItem);
      addedTickers.add(bankItem.ticker);
    }
  }

  // If user is searching fin nifty variations
  if (isFinNiftyMatch(q)) {
    const finItem = POPULAR_ITEMS.find((i) => i.ticker === 'FINNIFTY');
    if (finItem) {
      results.push(finItem);
      addedTickers.add(finItem.ticker);
    }
  }

  // General filter
  POPULAR_ITEMS.forEach((item) => {
    if (addedTickers.has(item.ticker)) return;
    const cleanItemTicker = item.ticker.toUpperCase().replace(/\s+/g, '');
    const cleanItemName = item.name.toUpperCase().replace(/\s+/g, '');
    if (cleanItemTicker.includes(q) || cleanItemName.includes(q) || q.includes(cleanItemTicker)) {
      results.push(item);
      addedTickers.add(item.ticker);
    }
  });

  return results.length > 0 ? results : POPULAR_ITEMS.slice(0, 5);
}
