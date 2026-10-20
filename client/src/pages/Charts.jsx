import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storage } from '../lib/storage';
import { POPULAR_ITEMS, resolveSymbol, searchSymbols } from '../lib/symbols';
import KiteCandleChart from '../components/KiteCandleChart';
import TradeTimingCard from '../components/TradeTimingCard';
import TradingViewAdvanced from '../components/TradingViewAdvanced';
import OrderModal from '../components/OrderModal';
import {
  Search,
  ShoppingCart,
  Layers,
  BarChart2,
  Tv,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import './Charts.css';

export default function Charts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSymbol = searchParams.get('symbol');

  // Load either from URL or last saved chart
  const initialChart = () => {
    if (urlSymbol) {
      const res = resolveSymbol(urlSymbol);
      return { tv: res.tv, symbol: res.ticker, name: res.name };
    }
    const saved = storage.get('last_chart', null);
    if (saved && saved.symbol) {
      const res = resolveSymbol(saved.symbol);
      return { tv: res.tv, symbol: res.ticker, name: res.name };
    }
    return { tv: 'BSE:SETFNIF50', symbol: 'NIFTY', name: 'NIFTY 50' };
  };

  const [currentChart, setCurrentChart] = useState(initialChart);
  const [chartEngine, setChartEngine] = useState('kite'); // 'kite' | 'tv'
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [showTvTiming, setShowTvTiming] = useState(false);

  const searchWrapperRef = useRef(null);
  const chartWrapperRef = useRef(null);

  // Watchlist symbols from local storage
  const watchlistSymbols = storage.get('watchlist_symbols', [
    'NIFTY',
    'BANKNIFTY',
    'NSE:RELIANCE',
    'NSE:TCS',
    'NSE:INFY',
    'NSE:HDFCBANK',
  ]);

  // Sync if URL param changes
  useEffect(() => {
    if (urlSymbol) {
      const res = resolveSymbol(urlSymbol);
      setCurrentChart({ tv: res.tv, symbol: res.ticker, name: res.name });
    }
  }, [urlSymbol]);

  // Save last selected chart
  useEffect(() => {
    storage.set('last_chart', currentChart);
  }, [currentChart]);

  // Fullscreen handlers
  const toggleChartFullscreen = async () => {
    const el = chartWrapperRef.current;
    if (!el) return;

    if (!isChartFullscreen && !document.fullscreenElement) {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        }
      } catch (e) {
        console.warn('Native fullscreen denied, using CSS overlay:', e);
      }
      setIsChartFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (e) {
        console.warn('Exit fullscreen error:', e);
      }
      setIsChartFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsChartFullscreen(!!document.fullscreenElement);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isChartFullscreen) {
        setIsChartFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChartFullscreen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectItem = (item) => {
    const raw = item.ticker || item.symbol || item.name || item.tv;
    const res = resolveSymbol(raw);
    const chartObj = { tv: res.tv, symbol: res.ticker, name: res.name };
    setCurrentChart(chartObj);
    setSearchParams({ symbol: res.ticker });
    setShowDropdown(false);
    setSearch('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    const resolved = resolveSymbol(search);
    selectItem({ tv: resolved.tv, ticker: resolved.ticker, name: resolved.name });
  };

  const suggestions = searchSymbols(search);

  return (
    <div className="page charts-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Charts</h1>
          <p className="page-sub">
            Real-time Japanese Candlesticks &amp; Technical Analysis for{' '}
            <strong>{currentChart.name}</strong> ({currentChart.symbol})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Chart Engine Switcher */}
          <div className="engine-toggle-group">
            <button
              className={`engine-btn ${chartEngine === 'kite' ? 'active' : ''}`}
              onClick={() => setChartEngine('kite')}
              title="Zerodha Kite Native Candlestick Chart (Yahoo Real-time Data)"
            >
              <BarChart2 size={13} /> Kite Pro
            </button>
            <button
              className={`engine-btn ${chartEngine === 'tv' ? 'active' : ''}`}
              onClick={() => setChartEngine('tv')}
              title="Full TradingView Widget"
            >
              <Tv size={13} /> TradingView
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            className={`btn btn-outline ${isChartFullscreen ? 'btn-primary' : ''}`}
            onClick={toggleChartFullscreen}
            title={isChartFullscreen ? 'Exit Fullscreen (Esc)' : 'Switch to Full Screen'}
          >
            {isChartFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isChartFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>

          <a
            className="btn btn-outline"
            href={`/option-chain?symbol=${currentChart.symbol}`}
          >
            <Layers size={14} /> Option Chain
          </a>
          <button
            className="btn btn-primary"
            onClick={() => setOrderModal({ symbol: currentChart.symbol, exchange: 'NSE' })}
          >
            <ShoppingCart size={15} /> Trade {currentChart.symbol}
          </button>
        </div>
      </div>

      <div className="charts-bar card">
        <div className="chart-search-wrapper" ref={searchWrapperRef}>
          <form className="chart-search-form" onSubmit={handleSearchSubmit}>
            <Search size={15} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search Nifty, BankNifty, Reliance, INFY..."
              value={search}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
            />
            <button className="btn btn-primary" type="submit">
              Load
            </button>
          </form>

          {showDropdown && (
            <div className="search-dropdown-menu">
              <div className="dropdown-title">Suggestions</div>
              {suggestions.length === 0 ? (
                <div className="dropdown-empty">Press Enter to search "{search}"</div>
              ) : (
                suggestions.map((item) => (
                  <div
                    key={item.tv + '-' + item.ticker}
                    className="dropdown-row"
                    onClick={() => selectItem(item)}
                  >
                    <div>
                      <div className="dropdown-sym">{item.name}</div>
                      <div className="dropdown-desc">{item.desc}</div>
                    </div>
                    <span className="badge badge-blue">{item.ticker}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Watchlist Quick Switcher */}
        <div className="quick-symbols">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'center', marginRight: 4 }}>
            Watchlist:
          </span>
          {watchlistSymbols.map((s) => {
            const clean = s.replace('NSE:', '').replace('BSE:', '');
            const res = resolveSymbol(clean);
            return (
              <button
                key={s}
                className={`pill-btn ${currentChart.symbol === res.ticker ? 'active' : ''}`}
                onClick={() => selectItem({ tv: res.tv, ticker: res.ticker, name: res.name })}
              >
                {res.name || clean}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Viewer */}
      <div
        ref={chartWrapperRef}
        className={`chart-view-wrapper card ${isChartFullscreen ? 'is-chart-fullscreen' : ''}`}
      >
        {isChartFullscreen && (
          <button
            className="btn btn-primary fs-floating-exit-btn"
            onClick={toggleChartFullscreen}
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 size={14} /> Exit Full Screen (Esc)
          </button>
        )}

        {chartEngine === 'kite' ? (
          <KiteCandleChart
            symbol={currentChart.symbol}
            displayName={currentChart.name}
          />
        ) : (
          <div style={{ height: isChartFullscreen ? '100vh' : 540, width: '100%', position: 'relative' }}>
            {showTvTiming && (
              <TradeTimingCard
                symbol={currentChart.symbol}
                displayName={currentChart.name}
                onClose={() => setShowTvTiming(false)}
              />
            )}
            <TradingViewAdvanced
              key={`${currentChart.tv}-${chartEngine}`}
              symbol={currentChart.tv}
              height="100%"
              theme="dark"
            />
          </div>
        )}
      </div>

      {orderModal && (
        <OrderModal
          symbol={orderModal.symbol}
          exchange={orderModal.exchange}
          onClose={() => setOrderModal(null)}
          onSuccess={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}
