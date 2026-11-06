import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Compass,
  Briefcase,
  ShoppingCart,
  History,
  BarChart2,
  Layers,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/watchlist', icon: TrendingUp, label: 'Watchlist' },
  { to: '/ipos', icon: CalendarDays, label: 'IPO Calendar' },
  { to: '/market-tracker', icon: Compass, label: 'Market Tracker' },
  { to: '/option-chain', icon: Layers, label: 'Option Chain' },
  { to: '/charts', icon: BarChart2, label: 'Charts' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/trades', icon: History, label: 'Trades' },
];

export default function Sidebar({ profile, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (onCollapse) onCollapse(next);
  };

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Logo + toggle row */}
      <div className="sidebar-logo">
        <div className="logo-mark">Z</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <div className="logo-name">ZeroTrader</div>
            <div className="logo-sub">Live Trading</div>
          </div>
        )}
        <button
          className="sidebar-toggle"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Profile: Zerodha User ID & Name are ONLY visible when logged into an active Kite session */}
      {profile ? (
        <div className="sidebar-profile" title={`Connected Kite Account: ${profile.user_id}`}>
          <div className="profile-avatar">
            {profile.user_name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div className="sidebar-profile-content">
              <div className="profile-meta">
                <div className="profile-name">{profile.user_name || 'Trader'}</div>
                <div className="profile-id">{profile.user_id}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="sidebar-profile sidebar-profile-disconnected" title="Zerodha Kite session not authenticated">
          <div className="profile-avatar profile-avatar-disconnected">
            <Lock size={15} />
          </div>
          {!collapsed && (
            <div className="sidebar-profile-content">
              <div className="profile-meta">
                <div className="profile-name" style={{ color: 'var(--text-muted)' }}>Session Inactive</div>
                <div className="profile-id" style={{ color: 'var(--text-muted)' }}>Login Required</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            end={to === '/'}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="nav-icon" />
            {!collapsed && <span className="nav-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="live-indicator">
          <span className={`live-dot ${profile ? '' : 'disconnected-dot'}`} />
          {!collapsed && (
            <span>{profile ? 'Live Market Connected' : 'Kite Session Inactive'}</span>
          )}
        </div>
      </div>
    </aside>
  );
}
