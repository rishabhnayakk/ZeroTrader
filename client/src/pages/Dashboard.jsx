import { useState, useEffect } from 'react';
import { getPnL, getMargins, getHoldings, getPositions, getLoginUrl, handleCallback } from '../lib/api';
import { storage } from '../lib/storage';
import StatCard from '../components/StatCard';
import { TrendingUp, DollarSign, Activity, Wallet, KeyRound, ExternalLink, RefreshCw, X, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pnlClass(v) {
  if (v > 0) return 'pnl-positive';
  if (v < 0) return 'pnl-negative';
  return 'pnl-zero';
}

export default function Dashboard() {
  const [pnl, setPnl] = useState(() => storage.get('cached_pnl', null));
  const [margins, setMargins] = useState(() => storage.get('cached_margins', null));
  const [holdings, setHoldings] = useState(() => storage.get('cached_holdings', []));
  const [positions, setPositions] = useState(() => storage.get('cached_positions', []));
  const [loading, setLoading] = useState(!pnl && !margins);
  const [error, setError] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [submittingToken, setSubmittingToken] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [pRes, mRes, hRes, posRes] = await Promise.allSettled([
        getPnL(),
        getMargins(),
        getHoldings(),
        getPositions(),
      ]);

      let anyAuthError = false;

      // Handle Margins / Funds
      if (mRes.status === 'fulfilled' && mRes.value.data) {
        setMargins(mRes.value.data);
        storage.set('cached_margins', mRes.value.data);
      } else if (mRes.status === 'rejected') {
        const detail = String(mRes.reason?.response?.data?.detail || '');
        if (detail.includes('api_key') || detail.includes('access_token')) {
          anyAuthError = true;
        }
      }

      // Handle P&L
      if (pRes.status === 'fulfilled' && pRes.value.data) {
        setPnl(pRes.value.data);
        storage.set('cached_pnl', pRes.value.data);
      } else if (pRes.status === 'rejected') {
        const detail = String(pRes.reason?.response?.data?.detail || '');
        if (detail.includes('api_key') || detail.includes('access_token')) {
          anyAuthError = true;
        }
      }

      // Handle Holdings
      if (hRes.status === 'fulfilled') {
        const holdingsData = hRes.value.data || [];
        setHoldings(holdingsData);
        storage.set('cached_holdings', holdingsData);
      }

      // Handle Positions
      if (posRes.status === 'fulfilled') {
        const positionsData = posRes.value.data?.net || [];
        setPositions(positionsData);
        storage.set('cached_positions', positionsData);
      }

      setIsSessionExpired(anyAuthError);
      if (anyAuthError) {
        storage.remove('user_profile');
        window.dispatchEvent(new CustomEvent('zerotrader_session_change', { detail: null }));
      } else {
        setError('');
      }
    } catch (e) {
      console.error('Error refreshing dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute available margin comprehensively across equity and commodity
  const equity = margins?.equity || {};
  const commodity = margins?.commodity || {};

  const eqAvailable = Number(
    equity.available?.live_balance ??
    equity.available?.cash ??
    equity.net ??
    0
  );

  const commAvailable = commodity.enabled ? Number(
    commodity.available?.live_balance ??
    commodity.available?.cash ??
    commodity.net ??
    0
  ) : 0;

  const available = eqAvailable + commAvailable;
  const eqUsed = Number(equity.utilised?.debits ?? 0);
  const commUsed = Number(commodity.utilised?.debits ?? 0);
  const used = eqUsed + commUsed;
  const openingBalance = Number(equity.available?.opening_balance ?? 0);

  const holdingsPnl = holdings.reduce((s, h) => s + (h.pnl || 0), 0);
  const holdingsValue = holdings.reduce((s, h) => s + (h.last_price * h.quantity || 0), 0);

  const handleOpenLogin = async () => {
    try {
      const res = await getLoginUrl();
      if (res.data?.login_url) {
        window.open(res.data.login_url, '_blank');
      } else {
        window.open('http://localhost:8000/api/login-url', '_blank');
      }
    } catch (e) {
      const apiKey = import.meta.env.VITE_ZERODHA_API_KEY;
      window.open(
        
        apiKey
          ? `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`
          : 'http://localhost:8000/api/login-url',
        '_blank'
      );
    }
  };

  const handleSubmitToken = async () => {
    let cleanToken = tokenInput.trim();
    if (!cleanToken) return;

    // If full URL was pasted, extract request_token parameter
    if (cleanToken.includes('request_token=')) {
      try {
        const urlObj = new URL(cleanToken);
        cleanToken = urlObj.searchParams.get('request_token') || cleanToken;
      } catch (e) {
        const match = cleanToken.match(/request_token=([a-zA-Z0-9]+)/);
        if (match) cleanToken = match[1];
      }
    }

    setSubmittingToken(true);
    setAuthErrorMsg('');
    setAuthSuccessMsg('');

    try {
      const res = await handleCallback(cleanToken);
      if (res.data?.margins) {
        setMargins(res.data.margins);
        storage.set('cached_margins', res.data.margins);
      }
      if (res.data?.profile) {
        storage.set('user_profile', res.data.profile);
        window.dispatchEvent(new CustomEvent('zerotrader_session_change', { detail: res.data.profile }));
      }
      setIsSessionExpired(false);
      setAuthSuccessMsg('Session generated successfully! Syncing live data...');
      setTimeout(() => {
        setShowAuthModal(false);
        setTokenInput('');
        setAuthSuccessMsg('');
        loadData();
      }, 1200);
    } catch (err) {
      setAuthErrorMsg(err.response?.data?.detail || 'Failed to authenticate token. Please check and try again.');
    } finally {
      setSubmittingToken(false);
    }
  };

  if (loading && !pnl && !margins) {
    return (
      <div className="page-loading">
        <span className="spin" style={{ width: 30, height: 30, borderWidth: 3 }} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your live trading overview (auto-synced with local storage)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isSessionExpired && (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowAuthModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <KeyRound size={14} /> Reconnect Zerodha
            </button>
          )}
          <div className="header-badge">
            <span className="live-dot" />
            Live
          </div>
        </div>
      </div>

      {/* Authentication Required Alert */}
      {isSessionExpired && (
        <div className="kite-auth-alert">
          <div className="kite-auth-alert-body">
            <div className="kite-auth-badge">AUTHENTICATION REQUIRED</div>
            <div className="kite-auth-title">Zerodha Kite Session Expired for Today</div>
            <div className="kite-auth-desc">
              Kite Connect requires a fresh daily access token every morning. Reconnect your account to sync your live funds, holdings, and P&L.
            </div>
          </div>
          <div className="kite-auth-actions">
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
              <KeyRound size={14} /> Connect Zerodha Session
            </button>
            <button className="btn btn-outline" onClick={handleOpenLogin}>
              <ExternalLink size={13} /> Open Kite Login
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          label="Day P&L"
          icon={Activity}
          value={<span className={pnlClass(pnl?.day_pnl)}>{fmt(pnl?.day_pnl ?? 0)}</span>}
          sub={pnl?.day_pnl >= 0 ? 'Profitable today' : 'Loss today'}
        />
        <StatCard
          label="Net P&L"
          icon={TrendingUp}
          value={<span className={pnlClass(pnl?.net_pnl)}>{fmt(pnl?.net_pnl ?? 0)}</span>}
          sub="Unrealised + Realised"
        />
        <StatCard
          label="Available Margin"
          icon={Wallet}
          value={fmt(available)}
          sub={
            commAvailable > 0
              ? `Eq: ${fmt(eqAvailable)} · Comm: ${fmt(commAvailable)}`
              : `Used: ${fmt(used)} · Opening: ${fmt(openingBalance)}`
          }
        />
        <StatCard
          label="Holdings Value"
          icon={DollarSign}
          value={fmt(holdingsValue)}
          sub={<span className={pnlClass(holdingsPnl)}>P&L: {fmt(holdingsPnl)}</span>}
        />
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Positions</span>
            <span className="badge badge-blue">{positions.length}</span>
          </div>
          {positions.length === 0 ? (
            <div className="empty-state">No open positions today</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg</th>
                  <th>LTP</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.slice(0, 10).map((p, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{p.tradingsymbol}</strong>
                      <br />
                      <span className="muted" style={{ fontSize: 11 }}>
                        {p.exchange}
                      </span>
                    </td>
                    <td className="mono">{p.quantity}</td>
                    <td className="mono">₹{p.average_price?.toFixed(2)}</td>
                    <td className="mono">₹{p.last_price?.toFixed(2)}</td>
                    <td className={`mono ${pnlClass(p.pnl)}`}>{fmt(p.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Holdings</span>
            <span className="badge badge-blue">{holdings.length}</span>
          </div>
          {holdings.length === 0 ? (
            <div className="empty-state">No holdings found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.slice(0, 8).map((h, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{h.tradingsymbol}</strong>
                    </td>
                    <td className="mono">{h.quantity}</td>
                    <td className="mono">₹{h.average_price?.toFixed(2)}</td>
                    <td className={`mono ${pnlClass(h.pnl)}`}>{fmt(h.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Kite Authentication Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="kite-auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kite-auth-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <KeyRound size={20} color="var(--accent)" />
                <span className="kite-auth-modal-title">Connect Zerodha Kite</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAuthModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="kite-auth-step">
              <div className="kite-auth-step-label">STEP 1: LOG IN TO ZERODHA</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Log in with your Zerodha Kite credentials and 2FA.
              </p>
              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleOpenLogin}
              >
                <ExternalLink size={14} /> Open Kite Login Page ↗
              </button>
            </div>

            <div className="kite-auth-step">
              <div className="kite-auth-step-label">STEP 2: PASTE REDIRECTED URL OR REQUEST TOKEN</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                After login, paste the full URL you were redirected to (or just the request_token):
              </p>
              <input
                className="kite-auth-modal-input"
                placeholder="e.g. http://127.0.0.1:8000/api/callback?request_token=... or raw token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>

            {authErrorMsg && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 14 }}>
                ❌ {authErrorMsg}
              </div>
            )}

            {authSuccessMsg && (
              <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 14 }}>
                ✅ {authSuccessMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={submittingToken || !tokenInput.trim()}
                onClick={handleSubmitToken}
              >
                {submittingToken ? <RefreshCw size={14} className="spin" /> : <KeyRound size={14} />}
                {submittingToken ? 'Generating Session...' : 'Authenticate & Sync Live Funds'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
              Tip: You can also run <code style={{ color: 'var(--accent)' }}>python generate_token.py</code> in the server folder anytime.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
