import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, Search, ExternalLink, Building2, Clock3, ArrowRight } from 'lucide-react';
import { getIpos } from '../lib/api';
import './IpoCalendar.css';

const WINDOW_DAYS = 30;

function parseIssueDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = raw.match(/^(\d{1,2})[- ]([A-Za-z]{3,9})[- ](\d{4})$/);
  if (match) {
    const month = new Date(Date.parse(match[2] + ' 1, 2000')).getMonth();
    if (!Number.isNaN(month)) return new Date(Number(match[3]), month, Number(match[1]));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}
function dateLabel(value) {
  const date = parseIssueDate(value);
  return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'To be announced';
}
function formatRange(start, end) {
  return `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}
function getTimeline(ipo, today) {
  const opens = parseIssueDate(ipo.open_date);
  const closes = parseIssueDate(ipo.close_date);
  const daysToOpen = opens ? Math.round((opens - today) / 86400000) : null;
  const daysToClose = closes ? Math.round((closes - today) / 86400000) : null;
  const active = (opens && closes && opens <= today && closes >= today) || (ipo.status || '').toLowerCase() === 'active';
  return { opens, closes, daysToOpen, daysToClose, active };
}

export default function IpoCalendar() {
  const [ipos, setIpos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [today, setToday] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const windowEnd = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + WINDOW_DAYS);
    return end;
  }, [today]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getIpos();
      setIpos(response.data?.ipos || []);
      setUpdatedAt(response.data?.updated_at || '');
      const now = new Date();
      setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    } catch (err) {
      setError(err.response?.data?.detail || 'IPO data could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const windowIpos = useMemo(() => ipos.map((ipo) => ({ ...ipo, timeline: getTimeline(ipo, today) }))
    .filter((ipo) => {
      const { opens, closes, active } = ipo.timeline;
      return (opens && opens >= today && opens <= windowEnd) || (active && (!closes || closes >= today));
    })
    .sort((a, b) => {
      const aDate = a.timeline.opens || a.timeline.closes;
      const bDate = b.timeline.opens || b.timeline.closes;
      return (aDate?.getTime() || Infinity) - (bDate?.getTime() || Infinity);
    }), [ipos, today, windowEnd]);

  const filtered = useMemo(() => windowIpos.filter((ipo) => {
    const matchesType = filter === 'All' || ipo.segment === filter;
    const matchesSearch = `${ipo.company_name || ''} ${ipo.symbol || ''}`.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  }), [windowIpos, filter, search]);

  const upcomingCount = windowIpos.filter((ipo) => !ipo.timeline.active && ipo.timeline.opens >= today).length;
  const openCount = windowIpos.filter((ipo) => ipo.timeline.active).length;
  const closingSoonCount = windowIpos.filter((ipo) => ipo.timeline.active && ipo.timeline.daysToClose !== null && ipo.timeline.daysToClose <= 3).length;

  return (
    <div className="page ipo-page">
      <div className="page-header ipo-heading">
        <div>
          <div className="ipo-eyebrow">PRIMARY MARKET · NSE INDIA</div>
          <h1 className="page-title">IPO Calendar</h1>
          <p className="page-sub">A focused view of IPOs opening or accepting applications over the next 30 days.</p>
        </div>
        <button className="btn btn-outline ipo-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'ipo-spinning' : ''} /> Refresh data
        </button>
      </div>

      <section className="ipo-window-banner">
        <div className="ipo-window-icon"><CalendarDays size={19}/></div>
        <div className="ipo-window-copy">
          <span className="ipo-window-label">YOUR IPO WATCH WINDOW</span>
          <strong>Next 30 days</strong>
          <small>{formatRange(today, windowEnd)}</small>
        </div>
        <div className="ipo-window-note"><span className="ipo-window-dot"/><span>Rolling date range · Updates daily</span></div>
      </section>

      <div className="ipo-stats">
        <div className="ipo-stat"><span className="ipo-stat-label">In this 30-day window</span><strong>{windowIpos.length}</strong><small>Confirmed dated issues</small></div>
        <div className="ipo-stat"><span className="ipo-stat-label">Opening soon</span><strong>{upcomingCount}</strong><small>Opens within 30 days</small></div>
        <div className="ipo-stat"><span className="ipo-stat-label">Currently open</span><strong>{openCount}</strong><small>Applications ongoing</small></div>
        <div className="ipo-stat"><span className="ipo-stat-label">Closing in 3 days</span><strong>{closingSoonCount}</strong><small>Last chance to apply</small></div>
      </div>

      <section className="ipo-panel">
        <div className="ipo-toolbar">
          <div><h2>Upcoming issues</h2><p>Only IPOs relevant to the selected 30-day period</p></div>
          <div className="ipo-controls">
            <div className="ipo-search"><Search size={15}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or symbol"/></div>
            <div className="ipo-tabs">
              {['All', 'Mainboard', 'SME'].map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>
        </div>

        {error && <div className="ipo-message ipo-error">{error} <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">Open NSE IPO page <ExternalLink size={12}/></a></div>}
        {loading ? <div className="ipo-message"><span className="spin"/> Loading IPO schedule from NSE…</div> : !error && filtered.length === 0 ? (
          <div className="ipo-empty-state">
            <span className="ipo-empty-icon"><CalendarDays size={22}/></span>
            <strong>No confirmed IPO dates in this 30-day window</strong>
            <p>There are no matching NSE issues scheduled between {formatRange(today, windowEnd)}. Refresh later for newly announced dates.</p>
            <a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">Check NSE announcements <ExternalLink size={12}/></a>
          </div>
        ) : (
          <div className="ipo-table-wrap">
            <table className="ipo-table">
              <thead><tr><th>Company</th><th>Segment</th><th>Issue period</th><th>Price band</th><th>Issue size</th><th>Status</th></tr></thead>
              <tbody>{filtered.map((ipo, index) => {
                const { active, daysToOpen, daysToClose } = ipo.timeline;
                const countdown = active
                  ? (daysToClose === 0 ? 'Closes today' : daysToClose > 0 ? `Closes in ${daysToClose} days` : 'Closing date passed')
                  : daysToOpen === 0 ? 'Opens today' : daysToOpen > 0 ? `Opens in ${daysToOpen} days` : 'Upcoming';
                return <tr key={ipo.symbol || `${ipo.company_name}-${index}`}>
                  <td><div className="ipo-company"><span className="ipo-company-icon"><Building2 size={15}/></span><span><strong>{ipo.company_name || ipo.symbol || 'Unnamed issue'}</strong><small>{ipo.symbol || 'NSE issue'}</small></span></div></td>
                  <td><span className="ipo-segment">{ipo.segment}</span></td>
                  <td><div className="ipo-period"><strong>{dateLabel(ipo.open_date)} <ArrowRight size={12}/> {dateLabel(ipo.close_date)}</strong><small className={active ? 'is-closing' : 'ipo-countdown'}>{countdown}</small></div></td>
                  <td>{ipo.price_band || 'Not announced'}</td>
                  <td>{ipo.issue_size || '—'}</td>
                  <td><span className={`ipo-status ${active ? 'is-open' : 'is-upcoming'}`}>{active ? 'Open now' : ipo.status || 'Upcoming'}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="ipo-footnote"><Clock3 size={13}/><span>{updatedAt ? `Last fetched ${new Date(updatedAt).toLocaleString('en-IN')}. ` : ''}The list uses NSE-announced dates; unannounced or undated issues are not counted in this 30-day view.</span><a href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noreferrer">NSE source <ExternalLink size={12}/></a></div>
      <div className="ipo-disclaimer">IPO information is for tracking and educational purposes only. It is not an investment recommendation.</div>
    </div>
  );
}
