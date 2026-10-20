import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { getOptionChain, getOptionChart } from '../lib/api';
import { storage } from '../lib/storage';
import { resolveSymbol } from '../lib/symbols';
import OrderModal from '../components/OrderModal';
import TvChart from '../components/TvChart';
import {
  Activity,
  BarChart2,
  TrendingUp,
  RefreshCw,
  X,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import './OptionChain.css';

const QUICK_UNDERLYINGS = [
  { label: 'NIFTY 50', symbol: 'NIFTY' },
  { label: 'BANK NIFTY', symbol: 'BANKNIFTY' },
  { label: 'FIN NIFTY', symbol: 'FINNIFTY' },
  { label: 'RELIANCE', symbol: 'RELIANCE' },
  { label: 'TCS', symbol: 'TCS' },
  { label: 'INFOSYS', symbol: 'INFY' },
  { label: 'HDFC BANK', symbol: 'HDFCBANK' },
];

export default function OptionChain() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSym = searchParams.get('symbol');
  const initialSym = urlSym || storage.get('last_option_chain_symbol', 'NIFTY');

  const [currentSymbol, setCurrentSymbol] = useState(initialSym);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExpiry, setSelectedExpiry] = useState('');
  const [showUnderlyingChart, setShowUnderlyingChart] = useState(false);
  const [activeOptionChart, setActiveOptionChart] = useState(null);
  const [orderModal, setOrderModal] = useState(null);

  const watchlistSymbols = storage.get('watchlist_symbols', ['NIFTY', 'BANKNIFTY', 'NSE:RELIANCE', 'NSE:TCS', 'NSE:INFY']);

  const loadChain = (sym = currentSymbol) => {
    setLoading(true);
    setError('');
    getOptionChain(sym)
      .then((res) => {
        setData(res.data);
        if (!selectedExpiry && res.data.expiries?.length) setSelectedExpiry(res.data.expiries[0]);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load option chain.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (urlSym && urlSym !== currentSymbol) {
      setCurrentSymbol(urlSym);
    }
  }, [urlSym]);

  useEffect(() => {
    storage.set('last_option_chain_symbol', currentSymbol);
    loadChain(currentSymbol);
  }, [currentSymbol]);

  const selectSymbol = (sym) => {
    const clean = sym.replace('NSE:', '').replace('BSE:', '');
    setCurrentSymbol(clean);
    setSearchParams({ symbol: clean });
  };

  const openOptionChart = async (strike, type, ltp) => {
    setActiveOptionChart({ loading: true, contract: `${currentSymbol} ${strike} ${type}`, strike, type, ltp });
    try {
      const res = await getOptionChart(currentSymbol, strike, type, ltp);
      setActiveOptionChart(res.data);
    } catch (e) {
      console.warn('Option chart error:', e);
    }
  };

  // TradingView widget for underlying (Dark mode)
  const tvContainerRef = useRef(null);
  useEffect(() => {
    if (!showUnderlyingChart || !tvContainerRef.current) return;
    tvContainerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        const resolved = resolveSymbol(currentSymbol);
        new window.TradingView.widget({
          autosize: true,
          symbol: resolved.tv,
          interval: '5',
          timezone: 'Asia/Kolkata',
          theme: 'dark',
          style: '1',
          locale: 'en',
          container_id: 'oc_tv_container',
          hide_side_toolbar: false,
          allow_symbol_change: false,
          studies: ['Volume@tv-basicstudies', 'RSI@tv-basicstudies'],
        });
      }
    };
    tvContainerRef.current.appendChild(script);
  }, [showUnderlyingChart, currentSymbol]);

  const strikes = data?.strikes || [];
  const spot = data?.spot_price;
  const atm = data?.atm_strike;
  const pcr = data?.pcr || 1;
  const totalCeOi = data?.total_ce_oi || 1;
  const totalPeOi = data?.total_pe_oi || 1;
  const peOiPct = Math.round((totalPeOi / (totalCeOi + totalPeOi)) * 100);

  return (
    <div className="page option-chain-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Option Chain</h1>
          <p className="page-sub">
            Live C&amp;P matrix, Greeks, PCR, and Strike Charts powered by TradingView engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn ${showUnderlyingChart ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowUnderlyingChart(!showUnderlyingChart)}
          >
            <Eye size={14} />{showUnderlyingChart ? 'Hide Spot Chart' : 'View Spot TV Chart'}
          </button>
          <button className="btn btn-outline" onClick={() => loadChain(currentSymbol)}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="oc-controls card">
        <div className="oc-pills-row">
          <span className="oc-label">Underlying:</span>
          {QUICK_UNDERLYINGS.map((item) => (
            <button
              key={item.symbol}
              className={`pill-btn ${currentSymbol === item.symbol ? 'active' : ''}`}
              onClick={() => selectSymbol(item.symbol)}
            >
              {item.label}
            </button>
          ))}
          <select
            className="select watchlist-select"
            value=""
            onChange={(e) => e.target.value && selectSymbol(e.target.value)}
          >
            <option value="">From Watchlist ↓</option>
            {watchlistSymbols.map((s) => {
              const clean = s.replace('NSE:', '').replace('BSE:', '');
              return <option key={s} value={clean}>{clean}</option>;
            })}
          </select>
        </div>
        {data?.expiries && (
          <div className="oc-expiry-wrapper">
            <span className="oc-label">Expiry:</span>
            <select
              className="select"
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              style={{ minWidth: 150 }}
            >
              {data.expiries.map((exp) => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TradingView Spot Chart (full TV widget) */}
      {showUnderlyingChart && (
        <div className="card oc-spot-chart-wrapper">
          <div className="chart-header">
            <strong>{currentSymbol} — Spot Intraday TradingView Chart</strong>
            <button className="btn btn-ghost" onClick={() => setShowUnderlyingChart(false)}>
              <X size={15} />
            </button>
          </div>
          <div id="oc_tv_container" ref={tvContainerRef} style={{ height: 380 }} />
        </div>
      )}

      {/* KPI Strip */}
      {data && (
        <div className="oc-kpi-bar card">
          <div className="oc-kpi-item">
            <span className="oc-kpi-lbl">Spot Price</span>
            <span className="oc-kpi-val highlight">
              ₹{spot?.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
            </span>
          </div>
          <div className="oc-kpi-divider" />
          <div className="oc-kpi-item">
            <span className="oc-kpi-lbl">ATM Strike</span>
            <span className="oc-kpi-val">₹{atm}</span>
          </div>
          <div className="oc-kpi-divider" />
          <div className="oc-kpi-item">
            <span className="oc-kpi-lbl">PCR</span>
            <span className={`oc-kpi-val ${pcr >= 1 ? 'green' : 'red'}`}>
              {pcr?.toFixed(2)}
              <span className="oc-pcr-sentiment">
                ({pcr >= 1.2 ? 'Bullish' : pcr <= 0.8 ? 'Bearish' : 'Neutral'})
              </span>
            </span>
          </div>
          <div className="oc-kpi-divider" />
          <div className="oc-kpi-item oc-oi-meter-wrapper">
            <div className="oc-oi-labels">
              <span className="green">PE OI: {totalPeOi.toLocaleString('en-IN')}</span>
              <span className="red">CE OI: {totalCeOi.toLocaleString('en-IN')}</span>
            </div>
            <div className="oc-oi-bar">
              <div className="oc-oi-fill-pe" style={{ width: `${peOiPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Error / Loading */}
      {error && <div className="toast-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Option Chain Table */}
      <div className="card oc-table-container">
        {loading ? (
          <div className="empty-state">
            <span className="spin" />
            <p>Fetching option chain for {currentSymbol}...</p>
          </div>
        ) : (
          <table className="oc-table">
            <thead>
              <tr className="oc-super-header">
                <th colSpan={7} className="th-calls">CALLS (CE)</th>
                <th className="th-strike">STRIKE</th>
                <th colSpan={7} className="th-puts">PUTS (PE)</th>
              </tr>
              <tr className="oc-sub-header">
                <th>OI</th>
                <th>Vol</th>
                <th>IV</th>
                <th>Delta</th>
                <th>LTP (₹)</th>
                <th>Chg</th>
                <th>Action</th>
                <th className="th-strike">Price</th>
                <th>Action</th>
                <th>Chg</th>
                <th>LTP (₹)</th>
                <th>Delta</th>
                <th>IV</th>
                <th>Vol</th>
                <th>OI</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((row) => {
                const isAtm = row.strike === atm;
                const isCeItm = spot && row.strike < spot;
                const isPeItm = spot && row.strike > spot;

                return (
                  <tr key={row.strike} className={isAtm ? 'atm-row' : ''}>
                    {/* CE */}
                    <td className={`mono ${isCeItm ? 'itm-cell' : ''}`}>{(row.ce.oi / 1000).toFixed(0)}K</td>
                    <td className={`mono ${isCeItm ? 'itm-cell' : ''}`}>{(row.ce.volume / 1000).toFixed(0)}K</td>
                    <td className={`mono muted ${isCeItm ? 'itm-cell' : ''}`}>{row.ce.iv}%</td>
                    <td className={`mono muted ${isCeItm ? 'itm-cell' : ''}`}>{row.ce.delta}</td>
                    <td
                      className={`mono oc-ltp ${isCeItm ? 'itm-cell' : ''}`}
                      onClick={() => openOptionChart(row.strike, 'CE', row.ce.ltp)}
                      title="Click to view CE TradingView Chart"
                    >
                      ₹{row.ce.ltp.toFixed(1)}
                    </td>
                    <td className={`mono ${isCeItm ? 'itm-cell' : ''} ${row.ce.change >= 0 ? 'green' : 'red'}`}>
                      {row.ce.change >= 0 ? '+' : ''}{row.ce.change}
                    </td>
                    <td className={`${isCeItm ? 'itm-cell' : ''}`}>
                      <div className="oc-actions-td">
                        <button className="btn-chart-icon" title="CE TradingView Chart"
                          onClick={() => openOptionChart(row.strike, 'CE', row.ce.ltp)}>
                          <BarChart2 size={13} />
                        </button>
                        <button className="btn btn-buy oc-trade-btn"
                          onClick={() => setOrderModal({ symbol: row.ce.symbol, exchange: 'NFO' })}>
                          B
                        </button>
                      </div>
                    </td>

                    {/* STRIKE */}
                    <td className={`strike-cell ${isAtm ? 'atm-badge-cell' : ''}`}>
                      <span className="strike-number">{row.strike}</span>
                      {isAtm && <span className="atm-pill">ATM</span>}
                    </td>

                    {/* PE */}
                    <td className={`${isPeItm ? 'itm-cell' : ''}`}>
                      <div className="oc-actions-td">
                        <button className="btn btn-sell oc-trade-btn"
                          onClick={() => setOrderModal({ symbol: row.pe.symbol, exchange: 'NFO' })}>
                          B
                        </button>
                        <button className="btn-chart-icon" title="PE TradingView Chart"
                          onClick={() => openOptionChart(row.strike, 'PE', row.pe.ltp)}>
                          <BarChart2 size={13} />
                        </button>
                      </div>
                    </td>
                    <td className={`mono ${isPeItm ? 'itm-cell' : ''} ${row.pe.change >= 0 ? 'green' : 'red'}`}>
                      {row.pe.change >= 0 ? '+' : ''}{row.pe.change}
                    </td>
                    <td
                      className={`mono oc-ltp ${isPeItm ? 'itm-cell' : ''}`}
                      onClick={() => openOptionChart(row.strike, 'PE', row.pe.ltp)}
                      title="Click to view PE TradingView Chart"
                    >
                      ₹{row.pe.ltp.toFixed(1)}
                    </td>
                    <td className={`mono muted ${isPeItm ? 'itm-cell' : ''}`}>{row.pe.delta}</td>
                    <td className={`mono muted ${isPeItm ? 'itm-cell' : ''}`}>{row.pe.iv}%</td>
                    <td className={`mono ${isPeItm ? 'itm-cell' : ''}`}>{(row.pe.volume / 1000).toFixed(0)}K</td>
                    <td className={`mono ${isPeItm ? 'itm-cell' : ''}`}>{(row.pe.oi / 1000).toFixed(0)}K</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* OPTION CONTRACT CHART MODAL */}
      {activeOptionChart && (
        <div className="modal-overlay" onClick={() => setActiveOptionChart(null)}>
          <div className="modal option-chart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 className="modal-title">{activeOptionChart.contract}</h2>
                  {activeOptionChart.option_type && (
                    <span className={`badge ${activeOptionChart.option_type === 'CE' ? 'badge-green' : 'badge-red'}`}>
                      {activeOptionChart.option_type}
                    </span>
                  )}
                </div>
                {activeOptionChart.breakeven && (
                  <div className="modal-symbol">
                    Premium: ₹{activeOptionChart.ltp} · Breakeven: ₹{activeOptionChart.breakeven}
                  </div>
                )}
              </div>
              <button className="btn btn-ghost" onClick={() => setActiveOptionChart(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="opt-chart-body">
              {activeOptionChart.loading ? (
                <div className="empty-state"><span className="spin" /></div>
              ) : (
                <>
                  {/* Intraday Premium — TradingView Lightweight Chart */}
                  <div className="opt-chart-section">
                    <div className="opt-section-title">
                      <Activity size={14} />
                      <span>Intraday Premium Price Chart</span>
                      <span className="opt-section-badge">TradingView Lightweight Engine</span>
                    </div>
                    <TvChart
                      data={activeOptionChart.intraday || []}
                      dataKey="price"
                      timeKey="time"
                      color={activeOptionChart.option_type === 'CE' ? '#00e676' : '#ff5252'}
                      areaColor={activeOptionChart.option_type === 'CE' ? 'rgba(0, 230, 118, 0.18)' : 'rgba(255, 82, 82, 0.18)'}
                      height={220}
                      type="area"
                    />
                  </div>

                  {/* Payoff at Expiry — Recharts Sensibull-style Area Curve */}
                  <div className="opt-chart-section">
                    <div className="opt-section-title">
                      <TrendingUp size={14} />
                      <span>Expiry P&amp;L Payoff Curve</span>
                      <span className="opt-section-badge">At Expiry</span>
                    </div>
                    <div style={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <AreaChart
                          data={activeOptionChart.payoff || []}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={activeOptionChart.option_type === 'CE' ? '#00e676' : '#ff5252'}
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor={activeOptionChart.option_type === 'CE' ? '#00e676' : '#ff5252'}
                                stopOpacity={0.0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#24282c" />
                          <XAxis
                            dataKey="underlying"
                            tick={{ fontSize: 10, fill: '#8e959e' }}
                            tickFormatter={(v) => `₹${v}`}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#8e959e' }}
                            tickFormatter={(v) => `₹${v}`}
                          />
                          <Tooltip
                            formatter={(val) => [`₹${val >= 0 ? '+' : ''}${val}`, 'P&L']}
                            labelFormatter={(label) => `Underlying: ₹${label}`}
                            contentStyle={{ background: '#1c1f22', borderRadius: 8, border: '1px solid #343a40', color: '#f8f9fa', fontSize: 12 }}
                          />
                          <ReferenceLine y={0} stroke="#495057" strokeDasharray="3 3" />
                          {activeOptionChart.breakeven && (
                            <ReferenceLine
                              x={activeOptionChart.breakeven}
                              stroke="#c0c0c0"
                              strokeDasharray="4 4"
                              label={{ value: `B/E ${activeOptionChart.breakeven}`, fill: '#c0c0c0', fontSize: 10, position: 'top' }}
                            />
                          )}
                          <Area
                            type="monotone"
                            dataKey="pnl"
                            stroke={activeOptionChart.option_type === 'CE' ? '#00e676' : '#ff5252'}
                            strokeWidth={2}
                            fill="url(#payoffGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="payoff-legend">
                      <span className="payoff-range">
                        Strike: ₹{activeOptionChart.strike} · Breakeven at ₹{activeOptionChart.breakeven}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!activeOptionChart.loading && (
              <div className="opt-modal-footer">
                <div className="opt-breakeven-badge">
                  Max Profit: <strong>Unlimited</strong> · Max Loss:{' '}
                  <strong className="red">₹{activeOptionChart.ltp} (premium paid)</strong>
                </div>
                <button
                  className={`btn ${activeOptionChart.option_type === 'CE' ? 'btn-buy' : 'btn-sell'}`}
                  onClick={() => {
                    setOrderModal({ symbol: activeOptionChart.contract, exchange: 'NFO' });
                    setActiveOptionChart(null);
                  }}
                >
                  <ShoppingCart size={14} /> Buy {activeOptionChart.option_type}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal && (
        <OrderModal
          symbol={orderModal.symbol}
          exchange={orderModal.exchange || 'NFO'}
          onClose={() => setOrderModal(null)}
          onSuccess={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}
