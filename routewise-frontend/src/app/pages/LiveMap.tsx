import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { LiveTracking } from '../components/LiveTracking';
import { Navigation2, Users, AlertCircle, TrendingUp, AlertTriangle, Layers, Map as MapIcon } from 'lucide-react';
import { eventAPI } from '../../utils/api';
import socketService from '../../utils/socket';

import '../styles/live-map.css';

interface TrackingStats {
  activeVehicles: number;
  totalDistance: string;
  avgSpeed: number;
  incidents: number;
}

export default function LiveMap() {
  const [stats, setStats] = useState<TrackingStats>({
    activeVehicles: 12,
    totalDistance: '245.8 km',
    avgSpeed: 42,
    incidents: 2,
  });

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [viewType, setViewType] = useState<'single' | 'all'>('single');

  useEffect(() => {
    const fetchEvents = async () => {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const data = await eventAPI.getAllEvents(user?.id);
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    };
    fetchEvents();
    
    // Listen for real-time updates
    socketService.connect();
    socketService.on('refreshEvents', fetchEvents);

    return () => {
      socketService.off('refreshEvents', fetchEvents);
    };
  }, [selectedEvent]);


  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeVehicles: prev.activeVehicles + Math.floor(Math.random() * 3 - 1),
        avgSpeed: Math.max(20, Math.min(60, prev.avgSpeed + Math.floor(Math.random() * 6 - 3))),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-map-page">
      <Navbar />

      <main className="live-map-main">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 className="page-title">Live Map Tracking</h1>
            <p className="page-subtitle">Real-time vehicle and route monitoring</p>
          </div>
          
          <div className="view-toggle-container" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => setViewType('single')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: viewType === 'single' ? 'white' : 'transparent',
                color: viewType === 'single' ? '#3b82f6' : '#64748b',
                boxShadow: viewType === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <MapIcon size={18} /> Single View
            </button>
            <button 
              onClick={() => setViewType('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: viewType === 'all' ? 'white' : 'transparent',
                color: viewType === 'all' ? '#3b82f6' : '#64748b',
                boxShadow: viewType === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <Layers size={18} /> Global View
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-container blue">
              <Navigation2 size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Active Vehicles</p>
              <p className="stat-value">{stats.activeVehicles}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Distance</p>
              <p className="stat-value">{stats.totalDistance}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container purple">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Avg Speed</p>
              <p className="stat-value">{stats.avgSpeed} km/h</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-container orange">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Incidents</p>
              <p className="stat-value">{stats.incidents}</p>
            </div>
          </div>
        </div>

        {/* Live Map Component */}
        <div className="map-section">
          {viewType === 'single' && events.some(e => 
            e.id !== selectedEvent?.id && 
            e.date === selectedEvent?.date && 
            e.startTime && selectedEvent?.startTime && 
            e.startTime === selectedEvent?.startTime
          ) && (
             <div className="emergency-alert" style={{backgroundColor: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
               <AlertTriangle size={20} />
               <strong>Slot Clash Detected!</strong> Another event is scheduled at the exact same time ({selectedEvent?.startTime}) on {selectedEvent?.date}. Consider adjusting your slot!
             </div>
          )}
          <LiveTracking selectedEvent={selectedEvent} allEvents={events} viewType={viewType} />
        </div>

        {/* Active Routes List */}
        <div className="active-routes-section">
          <h2 className="section-title">{viewType === 'all' ? 'Fleet Overview' : 'Active Routes'}</h2>
          <div className="routes-list">
            {events.map((event) => (
              <div 
                key={event.id}
                className={`route-item ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedEvent(event);
                  setViewType('single');
                }}
                style={{ cursor: 'pointer', border: selectedEvent?.id === event.id ? '2px solid #3b82f6' : '1px solid #e2e8f0' }}
              >
                <div className={`route-badge ${event.status === 'upcoming' ? 'pending' : 'active'}`}>{event.status}</div>
                <div className="route-details">
                  <h3 className="route-name">{event.name}</h3>
                  <p className="route-path">{event.startLocation} → {event.endLocation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
