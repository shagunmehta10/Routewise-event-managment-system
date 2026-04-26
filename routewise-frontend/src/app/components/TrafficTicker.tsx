import React, { useState, useEffect } from 'react';
import { Radio, Zap, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { eventAPI } from '../../utils/api';

export function TrafficTicker() {
  const [stats, setStats] = useState({ live: 0, clashes: 0, risk: 'Low' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const events = await eventAPI.getAllEvents();
        const live = events.filter((e: any) => eventAPI.getLiveStatus(e) === 'live').length;
        const clashes = eventAPI.detectClashes(events).filter((e: any) => e.clashing).length;
        
        let risk = 'Low';
        if (clashes > 0) risk = 'Critical';
        else if (live > 3) risk = 'Elevated';

        setStats({ live, clashes, risk });
      } catch (err) {
        console.error('Ticker fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="traffic-ticker-container">
      <div className="ticker-wrapper">
        {/* 1. Live Pulse */}
        <div className="ticker-segment">
          <div className="pulse-dot"></div>
          <span className="ticker-label">LIVE OPERATIONS:</span>
          <span className="ticker-value">{loading ? '...' : stats.live}</span>
        </div>

        <div className="ticker-divider"></div>

        {/* 2. Clash Alert */}
        <div className="ticker-segment">
          {stats.clashes > 0 ? (
            <div className="ticker-alert animate-shake">
              <AlertTriangle size={14} className="ticker-icon-red" />
              <span className="ticker-label-red">TACTICAL CLASHES:</span>
              <span className="ticker-value-red">{stats.clashes} DETECTED</span>
            </div>
          ) : (
            <div className="ticker-safe">
              <ShieldCheck size={14} className="ticker-icon-green" />
              <span className="ticker-label-green">SECTOR STATUS:</span>
              <span className="ticker-value-green">ALL CLEAR</span>
            </div>
          )}
        </div>

        <div className="ticker-divider"></div>

        {/* 3. Global Risk Score */}
        <div className="ticker-segment">
          <TrendingUp size={14} className="ticker-icon-blue" />
          <span className="ticker-label-blue">THREAT LEVEL:</span>
          <span className={`ticker-badge ${stats.risk.toLowerCase()}`}>
            {stats.risk.toUpperCase()}
          </span>
        </div>

        <div className="ticker-divider"></div>

        {/* 4. Scrolling News / Info */}
        <div className="ticker-scroller">
          <div className="scroller-content">
            <span>• HIGH CONGESTION REPORTED NEAR RAJPUR ROAD •</span>
            <span>• ALL BARAAT MISSIONS MUST USE APPROVED VENUES •</span>
            <span>• EMERGENCY AMBULANCE PRIORITY ACTIVE •</span>
            <span>• MISSION PENALTIES ARE NOW BEING ENFORCED •</span>
          </div>
        </div>
      </div>

      <style>{`
        .traffic-ticker-container {
          background: #0f172a;
          color: white;
          height: 36px;
          display: flex;
          align-items: center;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          position: relative;
          z-index: 2000;
        }
        .ticker-wrapper {
          display: flex;
          align-items: center;
          padding: 0 20px;
          width: 100%;
          gap: 20px;
        }
        .ticker-segment {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulseTicker 1.5s infinite;
        }
        @keyframes pulseTicker {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .ticker-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
        .ticker-value { font-size: 0.85rem; font-weight: 900; color: #10b981; }
        
        .ticker-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.1); }

        .ticker-alert { display: flex; align-items: center; gap: 6px; }
        .ticker-label-red { font-size: 0.65rem; font-weight: 800; color: #fca5a5; letter-spacing: 0.05em; }
        .ticker-value-red { font-size: 0.8rem; font-weight: 900; color: #ef4444; }
        
        .ticker-safe { display: flex; align-items: center; gap: 6px; }
        .ticker-label-green { font-size: 0.65rem; font-weight: 800; color: #6ee7b7; letter-spacing: 0.05em; }
        .ticker-value-green { font-size: 0.8rem; font-weight: 900; color: #10b981; }

        .ticker-label-blue { font-size: 0.65rem; font-weight: 800; color: #93c5fd; letter-spacing: 0.05em; }
        .ticker-badge {
          font-size: 0.6rem; font-weight: 900; padding: 2px 8px; border-radius: 4px;
        }
        .ticker-badge.low { background: #064e3b; color: #34d399; }
        .ticker-badge.elevated { background: #78350f; color: #fbbf24; }
        .ticker-badge.critical { background: #7f1d1d; color: #f87171; animation: blinker 1s linear infinite; }

        @keyframes blinker { 50% { opacity: 0.3; } }

        .ticker-scroller {
          flex: 1;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        .scroller-content {
          display: flex;
          gap: 40px;
          animation: scrollTicker 30s linear infinite;
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          white-space: nowrap;
        }
        @keyframes scrollTicker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
          40%, 60% { transform: translate3d(2px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
