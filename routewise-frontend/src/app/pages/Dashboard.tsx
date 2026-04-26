import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { PlusCircle, Navigation2, Building2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { LiveTracking } from '../components/LiveTracking';
import { EventCard } from '../components/EventCard';
import { eventAPI } from '../../utils/api';
import socketService from '../../utils/socket';

import '../styles/dashboard.css';

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const fetchEvents = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const data = await eventAPI.getAllEvents(user?.id);
      const eventsWithClash = eventAPI.detectClashes(data);

      const sorted = [...eventsWithClash].sort((a: any, b: any) => {
        const t1 = a.created_at ? new Date(a.created_at).getTime() : 0;
        const t2 = b.created_at ? new Date(b.created_at).getTime() : 0;
        return t2 - t1;
      });
      setEvents(sorted);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);

    // Listen for real-time updates
    socketService.connect();
    socketService.on('refreshEvents', () => {
      console.log('[Socket] Refreshing events due to server notification');
      fetchEvents(false);
    });

    return () => {
      socketService.off('refreshEvents');
    };
  }, []);


  return (
    <div className="dashboard-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url("/dashboard_bg.png")' }}></div>
      <Navbar />

      <main className="dashboard-main">
        {/* Urgent Alert Banner for Clashes */}
        {!loading && events.some(e => e.clashing) && (
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
            color: 'white', 
            padding: '1.25rem 2rem', 
            borderRadius: '1.5rem', 
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.6rem', borderRadius: '1rem' }}>
                <Navigation2 size={24} style={{ transform: 'rotate(45deg)' }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.5px' }}>CRITICAL: TACTICAL CLASH DETECTED</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Multiple mission routes are overlapping in the current sector. Deploy safe paths immediately.</p>
              </div>
            </div>
            <Link to="/fleet-map" style={{ 
              background: 'white', 
              color: '#b91c1c', 
              padding: '0.6rem 1.25rem', 
              borderRadius: '0.75rem', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              textDecoration: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              RESOLVE CLASH
            </Link>
          </div>
        )}

        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem' }}>
          {/* Left Side - Navigation Call-to-Action */}
          <div className="dashboard-left" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="create-event-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center', 
              padding: '2rem',
              background: 'white',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                padding: '1rem', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(0, 166, 126, 0.1)',
                marginBottom: '1rem' 
              }}>
                <PlusCircle color="#00A67E" size={40} />
              </div>
              <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.75rem', fontWeight: 900, color: '#ffffff' }}>Plan a Mission</h2>
              <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Deploy tactical routing and establish mission clearance parameters.
              </p>
              <Link to="/create-event" className="submit-button" style={{ 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem',
                width: '100%',
                maxHeight: '3rem',
                padding: '0.75rem',
                fontSize: '1rem'
              }}>
                Open Creation Page
              </Link>
            </div>

            {/* Link to Fleet Map */}
            <div className="fleet-map-promo-card" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '2rem',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              borderRadius: '1.5rem',
              color: 'white',
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '1rem' }}>
                  <Navigation2 size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Fleet Overview</h3>
              </div>
              <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Monitor all event routes simultaneously on our advanced global map.
              </p>
              <Link to="/fleet-map" style={{ 
                background: 'white', 
                color: '#1e40af', 
                padding: '0.75rem', 
                borderRadius: '0.75rem', 
                textAlign: 'center', 
                fontWeight: 700, 
                textDecoration: 'none',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Launch Global Map
              </Link>
            </div>

            {/* Venue Registration Card */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '1.5rem',
              background: 'rgba(255,158,11,0.1)',
              border: '1px solid rgba(255,158,11,0.2)',
              borderRadius: '1.5rem',
              color: '#92400e'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: '#f59e0b', padding: '0.5rem', borderRadius: '0.75rem', color: 'white' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f59e0b' }}>Banquet Owner?</h3>
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5, color: '#d97706' }}>
                Register your venue to provide approved service roads and hosting routes.
              </p>
              <Link to="/register-venue" style={{ 
                background: '#f59e0b', 
                color: 'white', 
                padding: '0.6rem', 
                borderRadius: '0.5rem', 
                textAlign: 'center', 
                fontWeight: 700, 
                textDecoration: 'none',
                fontSize: '0.85rem'
              }}>
                Register Venue
              </Link>
            </div>
          </div>


          <div className="dashboard-right">
            {!loading && events.length > 0 && (
              <LiveTracking 
                allEvents={events} 
                selectedEvent={selectedEvent}
                viewType={selectedEventId ? 'single' : 'all'} 
              />
            )}
            {loading && <div className="loading-map-placeholder">Initializing map and fleet data...</div>}
            {!loading && events.length === 0 && (
              <div className="no-data-placeholder">Create your first event to see it on the map!</div>
            )}
          </div>
        </div>

        {/* Status-based Event Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '4rem' }}>
          
          {/* 1. Live Events */}
          <section className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                <h2 className="section-title" style={{ margin: 0 }}>Live Operations</h2>
              </div>
              <Link to="/events" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Deploy Details →</Link>
            </div>
            
            {!loading && events.filter(e => eventAPI.getLiveStatus(e) === 'live').length > 0 ? (
              <div className="events-grid">
                {events.filter(e => eventAPI.getLiveStatus(e) === 'live').map((event) => (
                  <div key={event.id} onClick={() => setSelectedEventId(event.id)} style={{ cursor: 'pointer' }}>
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.4)', borderRadius: '1rem', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                No operations currently in progress.
              </div>
            )}
          </section>

          {/* 2. Upcoming Events */}
          <section className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Upcoming Deployments</h2>
              <Link to="/events" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>View Schedule →</Link>
            </div>
            
            {!loading && events.filter(e => eventAPI.getLiveStatus(e) === 'upcoming').length > 0 ? (
              <div className="events-grid">
                {events.filter(e => eventAPI.getLiveStatus(e) === 'upcoming').slice(0, 3).map((event) => (
                  <div key={event.id} onClick={() => setSelectedEventId(event.id)} style={{ cursor: 'pointer' }}>
                    <EventCard {...event} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.4)', borderRadius: '1rem', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                No upcoming events scheduled.
              </div>
            )}
          </section>

          {/* 3. Completed Events */}
          <section className="dashboard-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ margin: 0, color: '#94a3b8' }}>Mission History (Archive)</h2>
            </div>
            
            {!loading && events.filter(e => eventAPI.getLiveStatus(e) === 'completed').length > 0 ? (
              <div className="events-grid" style={{ opacity: 0.8 }}>
                {events.filter(e => eventAPI.getLiveStatus(e) === 'completed').slice(0, 3).map((event) => (
                  <EventCard key={event.id} {...event} />
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Event history is empty.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
