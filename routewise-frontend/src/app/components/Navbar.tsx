import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { MapPin, LogOut, LogIn, Calendar, PlusSquare, User, Navigation2, Settings, Info, Share2, Map } from 'lucide-react';
import { toast } from 'sonner';
import { useUser, UserButton } from '@clerk/clerk-react';
import '../styles/navbar.css';

import { TrafficTicker } from './TrafficTicker';
import { HistoryPopover } from './HistoryPopover';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();

  const handleShare = () => {
    const shareData = {
      title: 'RouteWise — Tactical Event Management',
      text: '🗺️ Manage events, avoid route clashes & track live missions with RouteWise!',
      url: window.location.origin,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `RouteWise — Tactical Event Management\n${window.location.origin}`
      );
      toast.success('RouteWise link copied to clipboard!');
    }
  };

  return (
    <>
      <TrafficTicker />
      <nav className="navbar">
      <div className="navbar-container">
        <Link to="/user-dashboard" className="navbar-logo">
          <MapPin className="logo-icon" />
          <span className="logo-text">RouteWise</span>
        </Link>

        <div className="navbar-links">
          <Link to="/events" className={`nav-link ${location.pathname === '/events' ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Events</span>
          </Link>
          <Link to="/fleet-map" className={`nav-link ${location.pathname === '/fleet-map' ? 'active' : ''}`}>
            <Navigation2 size={18} />
            <span>Global Map</span>
          </Link>
          <Link to="/create-event" className={`nav-link ${location.pathname === '/create-event' ? 'active' : ''}`}>
            <PlusSquare size={18} />
            <span>Create Event</span>
          </Link>
          {isSignedIn && (
            <>
              <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </>
          )}
          <Link to="/venues" className={`nav-link ${location.pathname === '/venues' ? 'active' : ''}`}>
            <Map size={18} />
            <span>Venues</span>
          </Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
            <Info size={18} />
            <span>About</span>
          </Link>
        </div>

        {isSignedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <HistoryPopover />
            <button onClick={handleShare} className="share-icon-btn" title="Share RouteWise">
              <Share2 size={18} />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={handleShare} className="share-icon-btn" title="Share RouteWise">
              <Share2 size={18} />
            </button>
            <Link to="/login" className="logout-button" style={{ textDecoration: 'none' }}>
              <LogIn size={18} />
              Login
            </Link>
          </div>
        )}
      </div>
      </nav>
    </>
  );
}
