import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Search, ExternalLink, Building2, Clock3 } from 'lucide-react';
import { getIpos } from '../lib/api';
import './IpoCalendar.css';

function dateLabel(value) {
  if (!value) return 'To be announced';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const match = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : value;
}

function dayDistance(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) - new Date().setHours(0,0,0,0)) / 86400000);
}

export default function IpoCalendar() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getIpos();
      setIpos(response.data?.ipos || []);
      setUpdatedAt(response.data?.updated_at || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'IPO data could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => ipos.filter((ipo) => {
    const matchesType = filter === 'All' || ipo.segment === filter;
    const matchesSearch = `${ipo.company_name} ${ipo.symbol}`.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  }), [ipos, filter, search]);

  const upcomingCount = ipos.filter((ipo) => (ipo.status || '').toLowerCase().includes('forthcoming')).length;
  const openCount = ipos.filter((ipo) => (ipo.status || '').toLowerCase() === 'active').length;

  return (
    <div className="page ipo-page">
      <div className="page-header ipo-heading">
        <div>
          <div className="ipo-eyebrow">PRIMARY MARKET · NSE INDIA</div>
          <h1 className="page-title">IPO Calendar</h1>
          <p className="page-sub">Track upcoming and active public issues by their bidding dates.</p>
        </div>
        <button className="btn btn-outline ipo-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ipo-spinning' : ''} /> Refresh data
        </button>
      </div>

      <div className="ipo-stats">
        <div className="ipo-stat"><span className="ipo-stat-label">Total issues</span><strong>{ipos.length}</strong><small>Current NSE feed</small></div>
        <div className="ipo-stat"><span className="ipo-stat-label">Upcoming</span><strong>{upcomingCount}</strong><small>Not yet open</small></div>
        <div className="ipo-stat"><span className="ipo-stat-label">Currently open</span><strong>{openCount}</strong><small>Applications ongoing</small></div>
        <div className="ipo-stat ipo-source-stat"><span className="ipo-stat-label">Data source</span><strong>NSE India</strong><small>Official exchange feed</small></div>
      </div>

      <section className="ipo-panel">
        <div className="ipo-toolbar">
          <div><h2>Issue schedule</h2><p>Sorted by issue opening date</p></div>
          <div className="ipo-controls">
            <div className="ipo-search"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or symbol"/></div>
            <div className="ipo-tabs">
              {['All', 'Mainboard', 'SME'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>
        </div>

        {error && <div className="ipo-message ipo-error">{error} <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">Open NSE IPO page <ExternalLink size={12}/></a></div>}
        {loading ? <div className="ipo-message"><span className="spin"/> Loading IPO schedule from NSE…</div> : !error && filtered.length === 0 ? <div className="ipo-message">No matching IPO issues found in the current NSE feed.</div> : (
          <div className="ipo-table-wrap">
            <table className="ipo-table">
              <thead><tr><th>Company</th><th>Segment</th><th>Opens</th><th>Closes</th><th>Price band</th><th>Issue size</th><th>Status</th></tr></thead>
              <tbody>{filtered.map((ipo, index) => {
                const days = dayDistance(ipo.open_date);
                const active = (ipo.status || '').toLowerCase() === 'active';
                return <tr key={ipo.symbol || `${ipo.company_name}-${index}`}>
                  <td><div className="ipo-company"><span className="ipo-company-icon"><Building2 size={15}/></span><span><strong>{ipo.company_name || ipo.symbol || 'Unnamed issue'}</strong><small>{ipo.symbol || 'NSE issue'}</small></span></div></td>
                  <td><span className="ipo-segment">{ipo.segment}</span></td>
                  <td><strong>{dateLabel(ipo.open_date)}</strong>{days !== null && days >= 0 && days <= 7 && !active && <small className="ipo-countdown">{days === 0 ? 'Opens today' : `In ${days} days`}</small>}</td>
                  <td>{dateLabel(ipo.close_date)}</td>
                  <td>{ipo.price_band || 'Not announced'}</td>
                  <td>{ipo.issue_size || '—'}</td>
                  <td><span className={`ipo-status ${active ? 'is-open' : 'is-upcoming'}`}>{active ? 'Open' : ipo.status || 'Upcoming'}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="ipo-footnote"><Clock3 size={13}/><span>{updatedAt ? `Last fetched ${new Date(updatedAt).toLocaleString('en-IN')}. ` : ''}Dates and issue details may change; verify with the exchange before applying.</span><a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">NSE source <ExternalLink size={12}/></a></div>
      <div className="ipo-disclaimer">IPO information is for tracking and educational purposes only. It is not an investment recommendation.</div>
    </div>
  );
}
