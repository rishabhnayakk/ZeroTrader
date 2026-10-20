import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  CheckCheck,
  X,
  Zap,
  BarChart2,
  ShoppingCart,
  Radio,
} from 'lucide-react';
import { getNews } from '../lib/api';
import { storage } from '../lib/storage';
import OrderModal from './OrderModal';
import './NotificationMenu.css';

export default function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState(() => storage.get('market_news_cache', []));
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'HIGH' | 'BULLISH' | 'BEARISH'
  const [readIds, setReadIds] = useState(() => storage.get('news_read_ids', []));
  const [orderModal, setOrderModal] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => storage.get('news_last_updated', ''));
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await getNews();
      if (res.data && res.data.news) {
        setNews(res.data.news);
        storage.set('market_news_cache', res.data.news);
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(now);
        storage.set('news_last_updated', now);
      }
    } catch (err) {
      console.warn('Failed to fetch financial news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Polling every 1 minute
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Esc
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = news.map((n) => n.id);
    setReadIds(allIds);
    storage.set('news_read_ids', allIds);
  };

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      storage.set('news_read_ids', updated);
    }
  };

  const unreadCount = news.filter((n) => !readIds.includes(n.id)).length;
  const highImpactUnread = news.filter((n) => !readIds.includes(n.id) && n.impact === 'HIGH').length;

  const filteredNews = news.filter((item) => {
    if (filter === 'HIGH') return item.impact === 'HIGH';
    if (filter === 'BULLISH') return item.sentiment === 'BULLISH';
    if (filter === 'BEARISH') return item.sentiment === 'BEARISH';
    return true;
  });

  const handleOpenChart = (symbol) => {
    setIsOpen(false);
    navigate(`/charts?symbol=${symbol}`);
  };

  const handleOpenTrade = (symbol) => {
    setOrderModal({ symbol, exchange: 'NSE' });
  };

  return (
    <div className="notif-menu-container" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        className={`notif-bell-btn ${isOpen ? 'active' : ''} ${highImpactUnread > 0 ? 'pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Daily Financial News & Market Impact"
        aria-label="Daily Financial News & Market Impact"
      >
        <Bell size={18} className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown News Panel */}
      {isOpen && (
        <div className="notif-dropdown card">
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-title">
              <div className="title-row">
                <Radio size={14} className="live-radio-icon" />
                <h3>Financial News &amp; Market Impact</h3>
              </div>
              <p className="notif-sub">
                Daily Financial Intel · Real-time Market Impact Analysis
                {lastUpdated && <span> · Updated {lastUpdated}</span>}
              </p>
            </div>
            <div className="notif-header-actions">
              <button
                className={`btn btn-ghost btn-icon ${loading ? 'spin' : ''}`}
                onClick={fetchNews}
                title="Refresh News Feed"
              >
                <RefreshCw size={14} />
              </button>
              {unreadCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>Mark Read</span>
                </button>
              )}
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="notif-filter-bar">
            <button
              className={`filter-pill ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All ({news.length})
            </button>
            <button
              className={`filter-pill ${filter === 'HIGH' ? 'active' : ''}`}
              onClick={() => setFilter('HIGH')}
            >
              <Zap size={11} color="var(--red)" />
              High Impact ({news.filter((n) => n.impact === 'HIGH').length})
            </button>
            <button
              className={`filter-pill ${filter === 'BULLISH' ? 'active' : ''}`}
              onClick={() => setFilter('BULLISH')}
            >
              <TrendingUp size={11} color="var(--green)" />
              Bullish ({news.filter((n) => n.sentiment === 'BULLISH').length})
            </button>
            <button
              className={`filter-pill ${filter === 'BEARISH' ? 'active' : ''}`}
              onClick={() => setFilter('BEARISH')}
            >
              <TrendingDown size={11} color="var(--red)" />
              Bearish ({news.filter((n) => n.sentiment === 'BEARISH').length})
            </button>
          </div>

          {/* News Items List */}
          <div className="notif-list">
            {loading && news.length === 0 ? (
              <div className="notif-empty">
                <span className="spin" style={{ width: 20, height: 20 }} />
                <p>Loading real-time market news...</p>
              </div>
            ) : filteredNews.length === 0 ? (
              <div className="notif-empty">
                <p>No news found for the selected filter.</p>
              </div>
            ) : (
              filteredNews.map((item) => {
                const isRead = readIds.includes(item.id);
                const isHigh = item.impact === 'HIGH';
                const isBull = item.sentiment === 'BULLISH';
                const isBear = item.sentiment === 'BEARISH';

                return (
                  <div
                    key={item.id}
                    className={`notif-card ${isRead ? 'read' : 'unread'} ${isHigh ? 'high-impact' : ''}`}
                    onClick={() => markAsRead(item.id)}
                  >
                    {/* Top Meta Badges */}
                    <div className="notif-card-meta">
                      <div className="badges-group">
                        <span className={`impact-badge ${item.impact.toLowerCase()}`}>
                          {isHigh && <Zap size={10} />}
                          {item.impact} IMPACT
                        </span>

                        <span
                          className={`sentiment-pill ${
                            isBull ? 'bullish' : isBear ? 'bearish' : 'neutral'
                          }`}
                        >
                          {isBull ? (
                            <TrendingUp size={11} />
                          ) : isBear ? (
                            <TrendingDown size={11} />
                          ) : (
                            <Activity size={11} />
                          )}
                          {item.sentiment} ({item.expected_move})
                        </span>

                        <span className="sector-badge">{item.sector}</span>
                      </div>

                      <div className="meta-time">
                        {!isRead && <span className="unread-dot" />}
                        <span>{item.pub_date ? item.pub_date.split(' ').slice(0, 4).join(' ') : 'Today'}</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <h4 className="notif-headline">{item.title}</h4>

                    {/* Market Impact Box */}
                    <div className="market-impact-box">
                      <div className="impact-box-header">
                        <div className="impact-box-title">
                          <Activity size={12} color="var(--accent)" />
                          <span>Market Impact Breakdown</span>
                        </div>
                        <div className="impact-symbol-tag">
                          Target: <strong>{item.symbol}</strong>
                        </div>
                      </div>
                      <p className="impact-explanation">
                        {item.summary ||
                          'Direct catalyst for index volatility and sector-specific asset valuations.'}
                      </p>
                      {item.affected_symbols && item.affected_symbols.length > 0 && (
                        <div className="affected-chips">
                          <span className="chips-label">Affected Tickers:</span>
                          {item.affected_symbols.map((sym) => (
                            <span key={sym} className="affected-chip">
                              {sym}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="notif-actions-bar">
                      <span className="source-tag">via {item.source}</span>

                      <div className="notif-buttons">
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChart(item.symbol);
                          }}
                          title={`View ${item.symbol} Chart`}
                        >
                          <BarChart2 size={12} /> Chart
                        </button>

                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTrade(item.symbol);
                          }}
                          title={`Trade ${item.symbol}`}
                        >
                          <ShoppingCart size={12} /> Trade
                        </button>

                        <a
                          className="btn btn-outline btn-xs news-link-btn"
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Read full article at source"
                        >
                          <span>Full Article</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
