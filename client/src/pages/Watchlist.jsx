import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuote } from '../lib/api';
import { storage } from '../lib/storage';
import { resolveSymbol } from '../lib/symbols';
import OrderModal from '../components/OrderModal';
import {
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart2,
} from 'lucide-react';
import './Watchlist.css';

const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'NSE:RELIANCE', 'NSE:TCS', 'NSE:INFY', 'NSE:HDFCBANK'];

export default function Watchlist() {
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState(() => storage.get('watchlist_symbols', DEFAULT_SYMBOLS));
  const [quotes, setQuotes] = useState(() => storage.get('watchlist_quotes', {}));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(null);
  const intervalRef = useRef();

  const fetchQuotes = async (syms = symbols) => {
    if (!syms.length) return;
    setLoading(true);
    try {
      const r = await getQuote(syms.join(','));
      const data = r.data || {};
      setQuotes(data);
      storage.set('watchlist_quotes', data);
    } catch (e) {
      console.warn('Quote fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    storage.set('watchlist_symbols', symbols);
    fetchQuotes(symbols);
    intervalRef.current = setInterval(() => fetchQuotes(symbols), 20000);
    return () => clearInterval(intervalRef.current);
  }, [symbols]);

  const addSymbol = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const resolved = resolveSymbol(input);
    const targetSymbol =
      resolved.ticker === 'NIFTY' || resolved.ticker === 'BANKNIFTY' || resolved.ticker === 'SENSEX'
        ? resolved.ticker
        : resolved.tv;

    if (!symbols.includes(targetSymbol)) {
      const updated = [...symbols, targetSymbol];
      setSymbols(updated);
      storage.set('watchlist_symbols', updated);
    }
    setInput('');
  };

  const removeSymbol = (s) => {
    const updated = symbols.filter((x) => x !== s);
    setSymbols(updated);
    storage.set('watchlist_symbols', updated);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-sub">Live market quotes with 1-click TradingView Charts & Option Chains</p>
        </div>
        <button className="btn btn-outline" onClick={() => fetchQuotes()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <form className="add-symbol-form" onSubmit={addSymbol}>
        <input
          className="input"
          placeholder="Add symbol or index (e.g. NIFTY, BANKNIFTY, TATAMOTORS)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <button className="btn btn-primary" type="submit">
          <Plus size={14} /> Add to Watchlist
        </button>
      </form>

      <div className="watchlist-grid">
        {symbols.map((sym) => {
          const q = quotes[sym];
          const change = q ? q.last_price - q.ohlc?.close : 0;
          const changePct = q?.ohlc?.close ? (change / q.ohlc.close) * 100 : 0;
          const isUp = change >= 0;
          const isIndex = sym === 'NIFTY' || sym === 'BANKNIFTY' || sym === 'SENSEX';
          const [exchange, ticker] = sym.includes(':') ? sym.split(':') : [isIndex ? 'INDEX' : 'NSE', sym];
          const cleanTicker = ticker || sym;

          return (
            <div className={`quote-card ${isUp ? 'up' : 'down'}`} key={sym}>
              <div className="quote-header">
                <div>
                  <div className="quote-symbol">{cleanTicker}</div>
                  <div className="quote-exchange">{exchange}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4 }}
                    onClick={() => navigate(`/charts?symbol=${cleanTicker}`)}
                    title="View TradingView Chart"
                  >
                    <BarChart2 size={14} color="var(--accent)" />
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4 }}
                    onClick={() => navigate(`/option-chain?symbol=${cleanTicker}`)}
                    title="View Option Chain"
                  >
                    <Layers size={14} color="var(--accent)" />
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 4 }}
                    onClick={() => removeSymbol(sym)}
                    title="Remove from watchlist"
                  >
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              </div>

              {q ? (
                <>
                  <div className="quote-price">
                    ₹{q.last_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`quote-change ${isUp ? 'green' : 'red'}`}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {isUp ? '+' : ''}
                    {change.toFixed(2)} ({isUp ? '+' : ''}
                    {changePct.toFixed(2)}%)
                  </div>
                  <div className="quote-meta">
                    <span>H: ₹{q.ohlc?.high?.toFixed(2)}</span>
                    <span>L: ₹{q.ohlc?.low?.toFixed(2)}</span>
                    <span>Prev: ₹{q.ohlc?.close?.toFixed(2)}</span>
                  </div>

                  <div className="quote-actions" style={{ flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                      <button
                        className="btn btn-buy"
                        style={{ flex: 1, justifyContent: 'center', padding: '6px 0' }}
                        onClick={() =>
                          setOrderModal({
                            symbol: cleanTicker,
                            exchange: exchange === 'INDEX' ? 'NSE' : exchange,
                            type: 'BUY',
                          })
                        }
                      >
                        Buy
                      </button>
                      <button
                        className="btn btn-sell"
                        style={{ flex: 1, justifyContent: 'center', padding: '6px 0' }}
                        onClick={() =>
                          setOrderModal({
                            symbol: cleanTicker,
                            exchange: exchange === 'INDEX' ? 'NSE' : exchange,
                            type: 'SELL',
                          })
                        }
                      >
                        Sell
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                      <button
                        className="btn btn-outline"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '5px 0',
                          fontSize: 12,
                        }}
                        onClick={() => navigate(`/charts?symbol=${cleanTicker}`)}
                      >
                        <BarChart2 size={13} /> TV Chart
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{
                          flex: 1,
                          justifyContent: 'center',
                          padding: '5px 0',
                          fontSize: 12,
                        }}
                        onClick={() => navigate(`/option-chain?symbol=${cleanTicker}`)}
                      >
                        <Layers size={13} /> Options
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="quote-loading">
                  {loading ? <span className="spin" style={{ width: 16, height: 16 }} /> : 'Loading...'}
                </div>
              )}
            </div>
          );
        })}
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
