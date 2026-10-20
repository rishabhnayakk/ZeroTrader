import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Activity, Sun, Moon } from 'lucide-react';
import NotificationMenu from './NotificationMenu';
import { getQuote } from '../lib/api';
import { storage } from '../lib/storage';
import './TopBar.css';

export default function TopBar({ profile }) {
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');
  const [theme, setTheme] = useState(() => storage.get('theme', 'dark'));
  const [indices, setIndices] = useState(() => storage.get('cached_topbar_indices', {
    NIFTY: { ltp: 22721.95, chg: 201.55, pct: 0.89 },
    BANKNIFTY: { ltp: 55481.05, chg: 224.45, pct: 0.41 },
    SENSEX: { ltp: 74800.20, chg: 485.10, pct: 0.65 },
  }));

  // Synchronize data-theme on html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Real-time clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live index quotes
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await getQuote('NIFTY,BANKNIFTY,SENSEX');
        if (res.data) {
          const mapped = {};
          ['NIFTY', 'BANKNIFTY', 'SENSEX'].forEach((sym) => {
            const q = res.data[sym];
            if (q) {
              const chg = q.last_price - (q.ohlc?.close || q.last_price);
              const pct = q.ohlc?.close ? (chg / q.ohlc.close) * 100 : 0;
              mapped[sym] = { ltp: q.last_price, chg, pct };
            }
          });
          if (Object.keys(mapped).length > 0) {
            setIndices((prev) => ({ ...prev, ...mapped }));
            storage.set('cached_topbar_indices', mapped);
          }
        }
      } catch (e) {
        // Fallback gracefully to default/cached indices
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-topbar">
      {/* Left: Live Ticker Strip */}
      <div className="topbar-tickers">
        {Object.entries(indices).map(([sym, data]) => {
          const isUp = (data?.chg ?? 0) >= 0;
          return (
            <div
              key={sym}
              className={`topbar-ticker-item ${isUp ? 'up' : 'down'}`}
              onClick={() => navigate(`/charts?symbol=${sym}`)}
              title={`View ${sym} Live Chart`}
            >
              <span className="ticker-sym">{sym === 'NIFTY' ? 'NIFTY 50' : sym === 'BANKNIFTY' ? 'BANK NIFTY' : sym}</span>
              <span className="ticker-val">
                ₹{data.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`ticker-chg ${isUp ? 'green' : 'red'}`}>
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isUp ? '+' : ''}
                {data.pct?.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Right Top Corner: Market Status, Clock, and Notification Menu */}
      <div className="topbar-right">
        {/* Market Status Pill */}
        <div className="topbar-market-status" title="Live exchange feed active">
          <span className="live-pulse-dot" />
          <span>NSE / BSE LIVE</span>
        </div>

        {/* Real-time Clock */}
        <div className="topbar-clock" title="Current Exchange Time">
          <Clock size={12} className="clock-icon" />
          <span>{timeStr || 'LIVE'}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          className="topbar-theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
          <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
        </button>

        {/* Notification Menu (Daily Financial News & Market Impact) */}
        <div className="topbar-notif-wrapper">
          <NotificationMenu />
        </div>

        {/* User Profile Badge: ONLY visible when logged in to Zerodha Kite session */}
        {profile ? (
          <div
            className="topbar-profile"
            title={`Zerodha Account: ${profile.user_name || 'Trader'} (${profile.user_id})`}
          >
            <div className="profile-chip-avatar">
              {profile.user_name?.[0] || 'U'}
            </div>
            <span className="profile-chip-name">{profile.user_name || 'Trader'}</span>
            <span className="profile-chip-id">{profile.user_id}</span>
          </div>
        ) : (
          <div
            className="topbar-profile topbar-profile-disconnected"
            title="Zerodha Kite session not authenticated"
          >
            <span className="topbar-disconnected-dot" />
            <span className="profile-chip-name muted">Session Inactive</span>
          </div>
        )}
      </div>
    </header>
  );
}
