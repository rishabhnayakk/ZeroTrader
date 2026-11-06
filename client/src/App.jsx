import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import IpoCalendar from './pages/IpoCalendar';
import Watchlist from './pages/Watchlist';
import OptionChain from './pages/OptionChain';
import Portfolio from './pages/Portfolio';
import Orders from './pages/Orders';
import Trades from './pages/Trades';
import Charts from './pages/Charts';
import MarketTracker from './pages/MarketTracker';
import { getProfile } from './lib/api';
import { storage } from './lib/storage';
import './App.css';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const checkSession = () => {
    getProfile()
      .then((r) => {
        if (r.data && r.data.user_id) {
          setProfile(r.data);
          storage.set('user_profile', r.data);
        } else {
          setProfile(null);
          storage.remove('user_profile');
        }
      })
      .catch(() => {
        // If Kite session is expired/invalid, clear profile so user ID is NOT visible
        setProfile(null);
        storage.remove('user_profile');
      });
  };

  useEffect(() => {
    checkSession();

    // Listen for session authentication or expiration events across the app
    const handleSessionChange = (e) => {
      if (e.detail && e.detail.user_id) {
        setProfile(e.detail);
        storage.set('user_profile', e.detail);
      } else {
        setProfile(null);
        storage.remove('user_profile');
      }
    };

    window.addEventListener('zerotrader_session_change', handleSessionChange);
    return () => window.removeEventListener('zerotrader_session_change', handleSessionChange);
  }, []);

  return (
    <BrowserRouter>
      <div className={`app-layout${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
        <Sidebar
          profile={profile}
          onCollapse={setSidebarCollapsed}
        />
        <main className="app-main">
          <TopBar profile={profile} />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/ipos" element={<IpoCalendar />} />
              <Route path="/market-tracker" element={<MarketTracker />} />
              <Route path="/option-chain" element={<OptionChain />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/trades" element={<Trades />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
