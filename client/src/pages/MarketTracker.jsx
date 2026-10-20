import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart2,
  ShoppingCart,
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import { getMarketTracker, getMarketTrackerHistory } from '../lib/api';
import OrderModal from '../components/OrderModal';
import './MarketTracker.css';

// Predefined list of pairs / symbols for the dropdown selector
const TRACKED_PAIRS = [
  {
    label: 'Indices',
    items: [
      { value: 'NIFTY 50', name: 'Nifty 50 Index (Benchmark)' },
      { value: 'BANKNIFTY', name: 'Bank Nifty Index' },
      { value: 'SENSEX', name: 'BSE Sensex Index' },
      { value: 'INDIA VIX', name: 'India VIX Volatility' },
    ],
  },
  {
    label: 'Sectoral Indices',
    items: [
      { value: 'NIFTY IT', name: 'Nifty IT Index' },
      { value: 'NIFTY AUTO', name: 'Nifty Auto Index' },
      { value: 'NIFTY METAL', name: 'Nifty Metal Index' },
      { value: 'NIFTY FMCG', name: 'Nifty FMCG Index' },
      { value: 'NIFTY PHARMA', name: 'Nifty Pharma Index' },
      { value: 'NIFTY ENERGY', name: 'Nifty Energy Index' },
      { value: 'NIFTY REALTY', name: 'Nifty Realty Index' },
    ],
  },
  {
    label: 'Top Equities / Stocks',
    items: [
      { value: 'RELIANCE', name: 'Reliance Industries (Energy)' },
      { value: 'HDFCBANK', name: 'HDFC Bank Ltd (Banking)' },
      { value: 'TCS', name: 'Tata Consultancy Services (IT)' },
      { value: 'INFY', name: 'Infosys Ltd (IT Services)' },
      { value: 'ICICIBANK', name: 'ICICI Bank Ltd (Banking)' },
      { value: 'TATAMOTORS', name: 'Tata Motors Ltd (Automobile)' },
      { value: 'SBIN', name: 'State Bank of India (PSU Banking)' },
      { value: 'BHARTIARTL', name: 'Bharti Airtel Ltd (Telecom)' },
      { value: 'ITC', name: 'ITC Ltd (FMCG)' },
      { value: 'LT', name: 'Larsen & Toubro (Infrastructure)' },
      { value: 'AXISBANK', name: 'Axis Bank Ltd (Banking)' },
      { value: 'MARUTI', name: 'Maruti Suzuki India (Auto)' },
      { value: 'SUNPHARMA', name: 'Sun Pharma Industries (Pharma)' },
      { value: 'TATASTEEL', name: 'Tata Steel Ltd (Metals)' },
    ],
  },
];

export default function MarketTracker() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [moversTab, setMoversTab] = useState('gainers');
  const [orderModal, setOrderModal] = useState(null);

  // Pair, Timeframe (1h / 4h), and Date Range State for Historical OHLC
  const [selectedPair, setSelectedPair] = useState('NIFTY 50');
  const [historyTimeframe, setHistoryTimeframe] = useState('1h');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Fetch Live Overview Data (Market Pulse, Sectors, Movers)
  const fetchTrackerData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getMarketTracker();
      if (res.data) {
        setData(res.data);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour12: true }));
      }
    } catch (err) {
      console.error('Failed to load market tracker:', err);
      setError('Unable to fetch live market tracker data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Filtered Historical OHLC Records for Selected Pair, 1H/4H, and Dates
  const fetchHistory = useCallback(
    async (pair = selectedPair, tf = historyTimeframe, from = fromDate, to = toDate) => {
      try {
        setHistoryLoading(true);
        setHistoryError('');
        const res = await getMarketTrackerHistory(pair, tf, from, to);
        if (res.data) {
          setHistoryData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch historical OHLC records:', err);
        setHistoryError('Unable to fetch historical OHLC for selected pair and dates.');
      } finally {
        setHistoryLoading(false);
      }
    },
    [selectedPair, historyTimeframe, fromDate, toDate]
  );

  useEffect(() => {
    fetchTrackerData();
    const interval = setInterval(fetchTrackerData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Automatically trigger history fetch when pair or timeframe changes
  useEffect(() => {
    fetchHistory(selectedPair, historyTimeframe, fromDate, toDate);
  }, [selectedPair, historyTimeframe, fetchHistory]);

  // Quick Date Presets
  const applyDatePreset = (days) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    const fromStr = past.toISOString().slice(0, 10);
    const toStr = today.toISOString().slice(0, 10);
    setFromDate(fromStr);
    setToDate(toStr);
    fetchHistory(selectedPair, historyTimeframe, fromStr, toStr);
  };

  // Export Filtered Historical OHLC Records to CSV
  const handleExportHistoryCSV = () => {
    const records = historyData?.records;
    if (!records?.length) return;

    const headers = [
      'Timeframe',
      'Date / Time',
      'Symbol',
      'Low',
      'Open',
      'Close',
      'High',
      'Range',
      'Change %',
      'Volume',
      'Trend',
    ];

    const rows = records.map((r) => [
      r.timeframe,
      `"${r.date}"`,
      r.symbol,
      r.low,
      r.open,
      r.close,
      r.high,
      r.range,
      `${r.pct}%`,
      r.volume,
      r.trend,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `OHLC_${selectedPair}_${historyTimeframe.toUpperCase()}_${fromDate}_to_${toDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pulse = data?.market_pulse;
  const breadth = pulse?.breadth;
  const stats = historyData?.period_stats;

  return (
    <div className="page market-tracker-page">
      {/* Page Header */}
      <div className="tracker-page-header">
        <div className="tracker-title-box">
          <div className="tracker-title-row">
            <h1 className="page-title">Daily Market Tracker</h1>
            <span className="live-market-pill">
              <span className="live-pulse-dot" /> LIVE NSE / BSE
            </span>
          </div>
          <p className="page-sub">
            Real-time Market Breadth, Sectoral Heatmap, and Multi-Timeframe (1H &amp; 4H) OHLC Radar
          </p>
        </div>

        <div className="tracker-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm header-action-btn"
            onClick={fetchTrackerData}
            title="Refresh Live Market Data"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Refreshing...' : `Live ${lastUpdated || 'Connected'}`}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm header-action-btn"
            onClick={handleExportHistoryCSV}
            title="Export Selected OHLC Records to CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {error && <div className="kite-auth-alert mb-4">{error}</div>}

      {/* 1. Market Pulse & Breadth Bar */}
      {pulse && (
        <div className="market-pulse-grid">
          {/* NIFTY 50 Card */}
          <div className="pulse-card">
            <div className="pulse-card-header">
              <span className="pulse-name">NIFTY 50</span>
              <span className={`pulse-badge ${(pulse.nifty.chg ?? 0) >= 0 ? 'up' : 'down'}`}>
                {(pulse.nifty.chg ?? 0) >= 0 ? '+' : ''}
                {pulse.nifty.pct?.toFixed(2)}%
              </span>
            </div>
            <div className="pulse-val">
              ₹{pulse.nifty.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="pulse-footer">
              <span className="pulse-sub-info">
                Day Range: ₹{pulse.nifty.low?.toFixed(0)} - ₹{pulse.nifty.high?.toFixed(0)}
              </span>
              <button
                type="button"
                className="mini-link-btn"
                onClick={() => navigate('/charts?symbol=NIFTY')}
                title="View NIFTY 50 Chart"
              >
                Chart <ArrowUpRight size={11} />
              </button>
            </div>
          </div>

          {/* SENSEX Card */}
          <div className="pulse-card">
            <div className="pulse-card-header">
              <span className="pulse-name">SENSEX</span>
              <span className={`pulse-badge ${(pulse.sensex.chg ?? 0) >= 0 ? 'up' : 'down'}`}>
                {(pulse.sensex.chg ?? 0) >= 0 ? '+' : ''}
                {pulse.sensex.pct?.toFixed(2)}%
              </span>
            </div>
            <div className="pulse-val">
              ₹{pulse.sensex.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="pulse-footer">
              <span className="pulse-sub-info">
                Day Range: ₹{pulse.sensex.low?.toFixed(0)} - ₹{pulse.sensex.high?.toFixed(0)}
              </span>
              <button
                type="button"
                className="mini-link-btn"
                onClick={() => navigate('/charts?symbol=SENSEX')}
                title="View SENSEX Chart"
              >
                Chart <ArrowUpRight size={11} />
              </button>
            </div>
          </div>

          {/* INDIA VIX Volatility Card */}
          <div className="pulse-card">
            <div className="pulse-card-header">
              <span className="pulse-name">INDIA VIX (VOLATILITY)</span>
              <span className={`pulse-badge ${(pulse.india_vix.chg ?? 0) <= 0 ? 'up' : 'down'}`}>
                {pulse.india_vix.pct?.toFixed(2)}%
              </span>
            </div>
            <div className="pulse-val">{pulse.india_vix.ltp?.toFixed(2)}</div>
            <div className="pulse-footer">
              <span className="vix-status-tag">{pulse.india_vix.status}</span>
              <span className="text-muted">Opt. Theta Window</span>
            </div>
          </div>

          {/* Market Breadth Card (Advances vs Declines) */}
          {breadth && (
            <div className="pulse-card breadth-card">
              <div className="pulse-card-header">
                <span className="pulse-name">MARKET BREADTH</span>
                <span className="breadth-sentiment-tag">{breadth.sentiment}</span>
              </div>
              <div className="breadth-numbers">
                <span className="breadth-adv">
                  <ArrowUpRight size={14} /> {breadth.advances} Advances
                </span>
                <span className="breadth-dec">
                  <ArrowDownRight size={14} /> {breadth.declines} Declines
                </span>
                {breadth.unchanged > 0 && (
                  <span className="breadth-unc">{breadth.unchanged} Unchanged</span>
                )}
              </div>
              <div className="breadth-bar-track" title={`${breadth.adv_ratio}% Advances`}>
                <div
                  className="breadth-bar-fill"
                  style={{ width: `${breadth.adv_ratio}%` }}
                />
              </div>
              <div className="breadth-ratio-caption">
                Advance Ratio: <strong>{breadth.adv_ratio}%</strong> of tracked basket
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Sectoral Heatmap & Performance Matrix */}
      <div className="tracker-section">
        <div className="section-header">
          <div className="section-title-group">
            <Activity size={16} className="section-icon" />
            <h2 className="section-title">Sectoral Heatmap &amp; Performance</h2>
          </div>
          <span className="section-meta">8 Primary Industry Sectors · Real-time Tick Analysis</span>
        </div>

        <div className="sector-heatmap-grid">
          {data?.sectors?.map((sec) => {
            const isUp = (sec.chg ?? 0) >= 0;
            return (
              <div
                key={sec.symbol}
                className={`sector-card ${isUp ? 'bullish-sec' : 'bearish-sec'}`}
                onClick={() => navigate(`/charts?symbol=${encodeURIComponent(sec.symbol)}`)}
                title={`Open ${sec.name} Chart`}
              >
                <div className="sector-top-row">
                  <div>
                    <span className="sector-category">{sec.category}</span>
                    <div className="sector-name">{sec.name}</div>
                  </div>
                  <span className={`sector-pct-chip ${isUp ? 'green' : 'red'}`}>
                    {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {isUp ? '+' : ''}
                    {sec.pct?.toFixed(2)}%
                  </span>
                </div>

                <div className="sector-price-row">
                  <span className="sector-ltp">
                    ₹{sec.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`sector-chg ${isUp ? 'green' : 'red'}`}>
                    {isUp ? '+' : ''}{sec.chg?.toFixed(2)} pts
                  </span>
                </div>

                {/* Day Range Slider */}
                <div className="sector-range-container">
                  <div className="sector-range-labels">
                    <span>L: ₹{sec.low?.toFixed(0)}</span>
                    <span>H: ₹{sec.high?.toFixed(0)}</span>
                  </div>
                  <div className="sector-range-bar">
                    <div
                      className="sector-range-marker"
                      style={{ left: `${sec.pos_in_range}%` }}
                    />
                  </div>
                </div>

                {/* 1H & 4H Trend Badges */}
                <div className="sector-badges-row">
                  <span className={`sec-trend-pill ${sec.trend_1h.toLowerCase().replace(/\s+/g, '-')}`}>
                    1H: {sec.trend_1h}
                  </span>
                  <span className={`sec-trend-pill ${sec.trend_4h.toLowerCase().replace(/\s+/g, '-')}`}>
                    4H: {sec.trend_4h}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Historical OHLC Tracker */}
      <div className="tracker-section historical-tracker-section">
        <div className="section-header">
          <div className="section-title-group">
            <Clock size={16} className="section-icon" />
            <h2 className="section-title">Historical OHLC Tracker</h2>
            <span className="badge badge-blue">
              {historyData?.records?.length || 0} Sessions Loaded
            </span>
          </div>
          <span className="section-meta">
            Filter by Instrument Pair, Timeframe (1H or 4H), and Custom Date Range
          </span>
        </div>

        {/* Filter and Control Bar */}
        <div className="card ohlc-filter-card">
          <div className="ohlc-filter-grid">
            {/* 1. Pair / Instrument Dropdown */}
            <div className="filter-field">
              <label className="filter-label">
                <Compass size={12} /> SELECT PAIR / SYMBOL
              </label>
              <select
                className="select filter-select pair-select"
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
              >
                {TRACKED_PAIRS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((it) => (
                      <option key={it.value} value={it.value}>
                        {it.value} — {it.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* 2. Timeframe Selector (1 hr or 4 hr) */}
            <div className="filter-field">
              <label className="filter-label">
                <Clock size={12} /> TIMEFRAME
              </label>
              <div className="timeframe-pill-group">
                <button
                  type="button"
                  className={`tf-pill-item ${historyTimeframe === '1h' ? 'active' : ''}`}
                  onClick={() => setHistoryTimeframe('1h')}
                  title="1-Hour Candlestick OHLC View"
                >
                  1 Hr (Hourly)
                </button>
                <button
                  type="button"
                  className={`tf-pill-item ${historyTimeframe === '4h' ? 'active' : ''}`}
                  onClick={() => setHistoryTimeframe('4h')}
                  title="4-Hour Multi-Session OHLC View"
                >
                  4 Hr (4-Hour)
                </button>
              </div>
            </div>

            {/* 3. From Date */}
            <div className="filter-field">
              <label className="filter-label">
                <Calendar size={12} /> FROM DATE
              </label>
              <input
                type="date"
                className="input filter-input date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
              />
            </div>

            {/* 4. To Date */}
            <div className="filter-field">
              <label className="filter-label">
                <Calendar size={12} /> TO DATE
              </label>
              <input
                type="date"
                className="input filter-input date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
              />
            </div>

            {/* 5. Action Buttons (Apply & Export) */}
            <div className="filter-field filter-actions-field">
              <label className="filter-label">&nbsp;</label>
              <div className="filter-btn-group">
                <button
                  type="button"
                  className="btn btn-primary filter-btn"
                  onClick={() => fetchHistory(selectedPair, historyTimeframe, fromDate, toDate)}
                  disabled={historyLoading}
                  title="Apply filters and fetch historical OHLC records"
                >
                  <Filter size={13} />
                  <span>{historyLoading ? 'Loading...' : 'Apply Filter'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline filter-btn"
                  onClick={handleExportHistoryCSV}
                  title="Download filtered OHLC records as CSV"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Date Presets Row */}
          <div className="quick-presets-row">
            <span className="presets-caption">Quick Presets:</span>
            <button type="button" className="preset-chip" onClick={() => applyDatePreset(1)}>
              Today / 1D
            </button>
            <button type="button" className="preset-chip" onClick={() => applyDatePreset(3)}>
              Last 3 Days
            </button>
            <button type="button" className="preset-chip" onClick={() => applyDatePreset(7)}>
              Last 7 Days
            </button>
            <button type="button" className="preset-chip" onClick={() => applyDatePreset(15)}>
              Last 15 Days
            </button>
            <button type="button" className="preset-chip" onClick={() => applyDatePreset(30)}>
              Last 30 Days
            </button>
          </div>
        </div>

        {historyError && <div className="kite-auth-alert mb-4">{historyError}</div>}

        {/* Period Summary Stats Strip */}
        {stats && (
          <div className="period-stats-strip">
            <div className="period-stat-item">
              <span className="stat-label">SELECTED PAIR</span>
              <span className="stat-val font-display text-primary">{historyData?.symbol}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">TIMEFRAME</span>
              <span className="stat-val font-mono">{historyData?.timeframe}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD LOW</span>
              <span className="stat-val font-mono text-red">₹{stats.period_low?.toFixed(2)}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD OPEN</span>
              <span className="stat-val font-mono">₹{stats.period_open?.toFixed(2)}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD CLOSE</span>
              <span className="stat-val font-mono">₹{stats.period_close?.toFixed(2)}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD HIGH</span>
              <span className="stat-val font-mono text-green">₹{stats.period_high?.toFixed(2)}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD RANGE</span>
              <span className="stat-val font-mono">₹{stats.period_range?.toFixed(2)}</span>
            </div>
            <div className="period-stat-item">
              <span className="stat-label">PERIOD RETURN</span>
              <span className={`stat-val font-mono ${(stats.period_return ?? 0) >= 0 ? 'text-green' : 'text-red'}`}>
                {(stats.period_return ?? 0) >= 0 ? '+' : ''}{stats.period_return?.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Aligned Historical OHLC Data Table */}
        <div className="card ohlc-table-card">
          <div className="table-responsive">
            <table className="table ohlc-aligned-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: '190px' }}>DATE / TIME SLOT</th>
                  <th style={{ textAlign: 'left', minWidth: '130px' }}>PAIR / SYMBOL</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>TIMEFRAME</th>
                  <th style={{ textAlign: 'right' }}>LOW (₹)</th>
                  <th style={{ textAlign: 'right' }}>OPEN (₹)</th>
                  <th style={{ textAlign: 'right' }}>CLOSE (₹)</th>
                  <th style={{ textAlign: 'right' }}>HIGH (₹)</th>
                  <th style={{ textAlign: 'right' }}>RANGE (₹)</th>
                  <th style={{ textAlign: 'right' }}>RETURN %</th>
                  <th style={{ textAlign: 'right' }}>VOLUME</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>TREND</th>
                  <th style={{ textAlign: 'right', minWidth: '130px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={12} className="table-loading-cell">
                      <RefreshCw size={16} className="spin" /> Loading historical OHLC candles...
                    </td>
                  </tr>
                ) : historyData?.records?.length ? (
                  historyData.records.map((rec) => {
                    const isPos = (rec.pct ?? 0) >= 0;
                    return (
                      <tr key={rec.id} className="ohlc-row">
                        <td className="cell-date font-mono" style={{ textAlign: 'left' }}>
                          {rec.date}
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          <span className="pair-badge">{rec.symbol}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-blue">{rec.timeframe}</span>
                        </td>
                        <td className="font-mono text-red" style={{ textAlign: 'right' }}>
                          ₹{rec.low?.toFixed(2)}
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right' }}>
                          ₹{rec.open?.toFixed(2)}
                        </td>
                        <td className="font-mono font-bold" style={{ textAlign: 'right' }}>
                          ₹{rec.close?.toFixed(2)}
                        </td>
                        <td className="font-mono text-green" style={{ textAlign: 'right' }}>
                          ₹{rec.high?.toFixed(2)}
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right' }}>
                          ₹{rec.range?.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`pnl-badge ${isPos ? 'green' : 'red'}`}>
                            {isPos ? '+' : ''}{rec.pct?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right' }}>
                          {rec.volume?.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`trend-status-chip ${
                              rec.trend === 'Bullish'
                                ? 'bullish'
                                : rec.trend === 'Bearish'
                                ? 'bearish'
                                : 'neutral'
                            }`}
                          >
                            {rec.trend}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row-action-btns">
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => navigate(`/charts?symbol=${encodeURIComponent(rec.symbol)}`)}
                              title={`Open ${rec.symbol} Candlestick Chart`}
                            >
                              <BarChart2 size={12} /> Chart
                            </button>
                            {!rec.symbol.includes('Index') &&
                              !rec.symbol.includes('NIFTY') &&
                              !rec.symbol.includes('SENSEX') && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  onClick={() => setOrderModal({ symbol: rec.symbol, exchange: 'NSE' })}
                                  title={`Trade ${rec.symbol}`}
                                >
                                  <ShoppingCart size={12} /> Trade
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className="empty-state">
                      No historical OHLC records found for {selectedPair} between {fromDate} and {toDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Market Movers (Top Gainers, Losers, Volume Shockers) */}
      <div className="tracker-section">
        <div className="section-header">
          <div className="section-title-group">
            <TrendingUp size={16} className="section-icon" />
            <h2 className="section-title">NSE Market Movers</h2>
          </div>
          <span className="section-meta">Top Performing &amp; Most Active Instruments</span>
        </div>

        <div className="card movers-full-card">
          <div className="movers-header">
            <div className="movers-tabs">
              <button
                type="button"
                className={`mover-tab-btn ${moversTab === 'gainers' ? 'active' : ''}`}
                onClick={() => setMoversTab('gainers')}
              >
                Top Gainers
              </button>
              <button
                type="button"
                className={`mover-tab-btn ${moversTab === 'losers' ? 'active' : ''}`}
                onClick={() => setMoversTab('losers')}
              >
                Top Losers
              </button>
              <button
                type="button"
                className={`mover-tab-btn ${moversTab === 'volume' ? 'active' : ''}`}
                onClick={() => setMoversTab('volume')}
              >
                Volume Shockers
              </button>
            </div>
            <span className="movers-tag">NSE 500 Segment · Real-time Ticks</span>
          </div>

          <div className="movers-grid">
            {(moversTab === 'gainers'
              ? data?.movers?.gainers
              : moversTab === 'losers'
              ? data?.movers?.losers
              : data?.movers?.volume_shockers
            )?.map((item, idx) => {
              const isGain = (item.pct ?? 0) >= 0;
              return (
                <div key={item.symbol} className="mover-item-box">
                  <div className="mover-rank">#{idx + 1}</div>
                  <div className="mover-info">
                    <div className="mover-sym">{item.symbol}</div>
                    <div className="mover-sec">{item.sector}</div>
                  </div>
                  <div className="mover-stats">
                    <div className="mover-price">₹{item.ltp?.toFixed(2)}</div>
                    <div className={`mover-pct ${isGain ? 'green' : 'red'}`}>
                      {isGain ? '+' : ''}{item.pct?.toFixed(2)}%
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => navigate(`/charts?symbol=${encodeURIComponent(item.symbol)}`)}
                    title={`Open ${item.symbol} Chart`}
                  >
                    Chart
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reused Order Modal for live trading */}
      {orderModal && (
        <OrderModal
          symbol={orderModal.symbol}
          exchange={orderModal.exchange}
          onClose={() => setOrderModal(null)}
          onSuccess={() => {
            setOrderModal(null);
            fetchTrackerData();
          }}
        />
      )}
    </div>
  );
}
