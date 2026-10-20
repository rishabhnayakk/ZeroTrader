import { useState, useEffect } from 'react';
import { getTrades } from '../lib/api';
import { RefreshCw } from 'lucide-react';

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getTrades().then(r => setTrades(r.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trades</h1>
          <p className="page-sub">Executed trades today</p>
        </div>
        <button className="btn btn-outline" onClick={load}><RefreshCw size={14}/>Refresh</button>
      </div>
      <div className="card">
        {loading ? (
          <div style={{padding:40,textAlign:'center'}}><span className="spin"/></div>
        ) : trades.length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>No trades executed today</div>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Product</th><th>Time</th></tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <tr key={i}>
                  <td><strong>{t.tradingsymbol}</strong></td>
                  <td><span className={`badge ${t.transaction_type === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.transaction_type}</span></td>
                  <td className="mono">{t.quantity}</td>
                  <td className="mono">₹{t.average_price?.toFixed(2)}</td>
                  <td><span className="badge badge-blue">{t.product}</span></td>
                  <td style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(t.fill_timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
