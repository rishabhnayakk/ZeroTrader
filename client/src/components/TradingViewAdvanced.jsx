import { useEffect, useRef } from 'react';

export default function TradingViewAdvanced({ symbol = 'BSE:SETFNIF50', height = '100%', theme = 'dark' }) {
  const containerRef = useRef(null);

  // Map any restricted or misspelled symbols to supported TradingView tickers
  let tvSymbol = symbol;
  const clean = (symbol || '').toUpperCase().replace(/\s+/g, '');
  if (!clean || clean === 'NIFTY' || clean === 'NSE:NIFTY' || clean === 'NSE:NIFTYBEES' || clean.includes('NOFTY') || clean.includes('NIFTYFIFTY') || clean.includes('NIFTYFITY')) {
    tvSymbol = 'BSE:SETFNIF50';
  } else if (clean === 'BANKNIFTY' || clean === 'NSE:BANKNIFTY' || clean === 'NSE:BANKBEES' || clean.includes('BAKNIFTY')) {
    tvSymbol = 'BSE:SETFNIFBK';
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);

    return () => {
      try {
        if (container) {
          container.innerHTML = '';
        }
      } catch (e) {
        // Safe cleanup
      }
    };
  }, [tvSymbol, theme]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ height, width: '100%', position: 'relative' }}
    />
  );
}
