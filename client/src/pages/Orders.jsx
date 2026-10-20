import { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '../lib/api';
import { storage } from '../lib/storage';
import OrderModal from '../components/OrderModal';
import { PlusCircle, RefreshCw, X } from 'lucide-react';
import './Orders.css';

const STATUS_BADGE = {
  COMPLETE: 'badge-green',
  OPEN: 'badge-blue',
  CANCELLED: 'badge-yellow',
  REJECTED: 'badge-red',
};

export default function Orders() {
  const [orders, setOrders] = useState(() => storage.get('orders_cache', []));
  const [loading, setLoading] = useState(!orders.length);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState('');

  const load = () => {
    setLoading(true);
    getOrders()
      .then((r) => {
        const liveOrders = r.data || [];
        const localOrders = storage.get('local_placed_orders', []);
        // Merge live orders with any locally recorded orders
        const combined = [...liveOrders];
        localOrders.forEach((lo) => {
          if (!combined.some((o) => o.order_id === lo.order_id)) {
            combined.unshift(lo);
          }
        });
        setOrders(combined);
        storage.set('orders_cache', combined);
      })
      .catch(() => {
        // Fallback to local storage cache if network error
        const localOnly = storage.get('local_placed_orders', []);
        if (localOnly.length) setOrders(localOnly);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to cancel');
    } finally {
      setCancelling('');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">Today's order book (persisted locally)</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusCircle size={14} /> New Order
          </button>
        </div>
      </div>

      <div className="card">
        {loading && !orders.length ? (
          <div className="empty-state">
            <span className="spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders placed today</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {o.order_id}
                  </td>
                  <td>
                    <strong>{o.tradingsymbol}</strong>
                    <span
                      className={`badge ${o.transaction_type === 'BUY' ? 'badge-green' : 'badge-red'}`}
                      style={{ marginLeft: 6 }}
                    >
                      {o.transaction_type}
                    </span>
                  </td>
                  <td>{o.order_type}</td>
                  <td className="mono">
                    {o.quantity}/{o.pending_quantity || 0}
                  </td>
                  <td className="mono">₹{o.price || o.average_price || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.status] || 'badge-blue'}`}>{o.status}</span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(o.order_timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    {o.status === 'OPEN' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => handleCancel(o.order_id)}
                        disabled={cancelling === o.order_id}
                      >
                        <X size={12} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <OrderModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
