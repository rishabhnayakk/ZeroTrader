import { useState, useEffect } from 'react';
import { getHoldings } from '../lib/api';
import { storage } from '../lib/storage';
import OrderModal from '../components/OrderModal';
import { PlusCircle, RefreshCw } from 'lucide-react';
import './Portfolio.css';

function fmt(n) {
  if (!n && n !== 0) return '—';
  return `₹${n.toFixed(2)}`;
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState(() => storage.get('portfolio_holdings', []));
  const [loading, setLoading] = useState(!holdings.length);
  const [orderModal, setOrderModal] = useState(null);

  const load = () => {
    setLoading(true);
    getHoldings()
      .then((r) => {
        const data = r.data || [];
        setHoldings(data);
        storage.set('portfolio_holdings', data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const totalValue = holdings.reduce((s, h) => s + (h.last_price * h.quantity || 0), 0);
  const totalInvested = holdings.reduce((s, h) => s + (h.average_price * h.quantity || 0), 0);
  const totalPnl = totalValue - totalInvested;
  const pnlPct = totalInvested ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-sub">Long-term holdings (saved locally)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setOrderModal({ symbol: '', exchange: 'NSE' })}>
            <PlusCircle size={14} /> New Order
          </button>
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="summary-item">
          <div className="summary-label">Current Value</div>
          <div className="summary-value">₹{totalValue.toFixed(2)}</div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <div className="summary-label">Invested</div>
          <div className="summary-value">₹{totalInvested.toFixed(2)}</div>
        </div>
        <div className="summary-divider" />
        <div className="summary-item">
          <div className="summary-label">Total P&L</div>
          <div className={`summary-value ${totalPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toFixed(2)}
            <span className="summary-pct">
              ({pnlPct >= 0 ? '+' : ''}
              {pnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        {loading && !holdings.length ? (
          <div className="empty-state">
            <span className="spin" />
          </div>
        ) : holdings.length === 0 ? (
          <div className="empty-state">No holdings found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg Price</th>
                <th>LTP</th>
                <th>Current Value</th>
                <th>P&L</th>
                <th>P&L%</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h, i) => {
                const val = h.last_price * h.quantity;
                const inv = h.average_price * h.quantity;
                const pnl = val - inv;
                const pct = inv ? (pnl / inv) * 100 : 0;
                return (
                  <tr key={i}>
                    <td>
                      <div className="symbol-cell">
                        <strong>{h.tradingsymbol}</strong>
                        <span className="badge badge-blue">{h.exchange}</span>
                      </div>
                    </td>
                    <td className="mono">{h.quantity}</td>
                    <td className="mono">{fmt(h.average_price)}</td>
                    <td className="mono">{fmt(h.last_price)}</td>
                    <td className="mono">₹{val.toFixed(2)}</td>
                    <td className={`mono ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                      {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                    </td>
                    <td className={`mono ${pct >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
                      {pct >= 0 ? '+' : ''}
                      {pct.toFixed(2)}%
                    </td>
                    <td>
                      <button
                        className="btn btn-sell"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => setOrderModal({ symbol: h.tradingsymbol, exchange: h.exchange })}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {orderModal && (
        <OrderModal
          symbol={orderModal.symbol}
          exchange={orderModal.exchange}
          onClose={() => setOrderModal(null)}
          onSuccess={() => {
            setOrderModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
