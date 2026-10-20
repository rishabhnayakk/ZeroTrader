import { useState } from 'react';
import { placeOrder } from '../lib/api';
import { storage } from '../lib/storage';
import { X } from 'lucide-react';
import './OrderModal.css';

export default function OrderModal({ symbol, exchange = 'NSE', onClose, onSuccess }) {
  const [form, setForm] = useState({
    tradingsymbol: symbol || '',
    exchange: exchange,
    transaction_type: 'BUY',
    quantity: 1,
    product: 'CNC',
    order_type: 'MARKET',
    price: '',
    trigger_price: '',
    validity: 'DAY',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBuy = form.transaction_type === 'BUY';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, quantity: parseInt(form.quantity) };
      if (form.order_type === 'MARKET') {
        delete payload.price;
        delete payload.trigger_price;
      }
      if (form.price) payload.price = parseFloat(form.price);
      if (form.trigger_price) payload.trigger_price = parseFloat(form.trigger_price);

      const res = await placeOrder(payload);

      // Save order record to LocalStorage audit log
      const localOrders = storage.get('local_placed_orders', []);
      const newOrderLog = {
        order_id: res.data?.order_id || `LOC-${Date.now()}`,
        tradingsymbol: form.tradingsymbol,
        exchange: form.exchange,
        transaction_type: form.transaction_type,
        quantity: form.quantity,
        product: form.product,
        order_type: form.order_type,
        price: form.price || 'MARKET',
        status: 'COMPLETE',
        order_timestamp: new Date().toISOString(),
      };
      storage.set('local_placed_orders', [newOrderLog, ...localOrders]);

      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Place Order</h2>
            <div className="modal-symbol">
              {form.tradingsymbol} · {form.exchange}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="order-type-toggle">
          <button
            className={`toggle-btn${isBuy ? ' active-buy' : ''}`}
            onClick={() => setForm((p) => ({ ...p, transaction_type: 'BUY' }))}
            type="button"
          >
            BUY
          </button>
          <button
            className={`toggle-btn${!isBuy ? ' active-sell' : ''}`}
            onClick={() => setForm((p) => ({ ...p, transaction_type: 'SELL' }))}
            type="button"
          >
            SELL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="label">Symbol</label>
              <input
                className="input"
                name="tradingsymbol"
                value={form.tradingsymbol}
                onChange={handleChange}
                placeholder="e.g. INFY"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Exchange</label>
              <select className="select" name="exchange" value={form.exchange} onChange={handleChange}>
                <option>NSE</option>
                <option>BSE</option>
                <option>NFO</option>
                <option>MCX</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Quantity</label>
              <input
                className="input"
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Product</label>
              <select className="select" name="product" value={form.product} onChange={handleChange}>
                <option value="CNC">CNC (Delivery)</option>
                <option value="MIS">MIS (Intraday)</option>
                <option value="NRML">NRML (F&O)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Order Type</label>
              <select className="select" name="order_type" value={form.order_type} onChange={handleChange}>
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
                <option value="SL">SL</option>
                <option value="SL-M">SL-M</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Validity</label>
              <select className="select" name="validity" value={form.validity} onChange={handleChange}>
                <option value="DAY">DAY</option>
                <option value="IOC">IOC</option>
              </select>
            </div>
          </div>

          {(form.order_type === 'LIMIT' || form.order_type === 'SL') && (
            <div className="form-group">
              <label className="label">Price (₹)</label>
              <input
                className="input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                step="0.05"
                placeholder="0.00"
              />
            </div>
          )}
          {(form.order_type === 'SL' || form.order_type === 'SL-M') && (
            <div className="form-group">
              <label className="label">Trigger Price (₹)</label>
              <input
                className="input"
                type="number"
                name="trigger_price"
                value={form.trigger_price}
                onChange={handleChange}
                step="0.05"
                placeholder="0.00"
              />
            </div>
          )}

          {error && <div className="order-error">{error}</div>}

          <button
            type="submit"
            className={`btn ${isBuy ? 'btn-buy' : 'btn-sell'} submit-btn`}
            disabled={loading}
          >
            {loading ? <span className="spin" style={{ width: 16, height: 16 }} /> : null}
            {isBuy ? 'Place Buy Order' : 'Place Sell Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
