import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '../components/Navbar';
import { EventCard } from '../components/EventCard';
import { eventAPI } from '../../utils/api';
import { Search, Plus } from 'lucide-react';
import '../styles/events.css';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchEvents = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const data = await eventAPI.getAllEvents(user?.id);
      const eventsWithClash = eventAPI.detectClashes(data);
      setEvents(eventsWithClash);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
    const interval = setInterval(() => fetchEvents(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = events.filter((event) => {
    const name = event.name || '';
    const description = event.description || '';
    const currentStatus = eventAPI.getLiveStatus(event);
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                          currentStatus === filterStatus;
                          
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="events-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url("/dashboard_bg.png")' }}></div>
      <Navbar />

      <main className="events-main">
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
                <Search size={24} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>CONFLICT DETECTED</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Multiple mission routes are overlapping. Check the Global Fleet Map for safe paths.</p>
              </div>
            </div>
          </div>
        )}

        <div className="events-header">
          <h1 className="page-title">Mission Archives</h1>
          <Link to="/create-event" className="create-event-btn" style={{ textDecoration: 'none' }}>
            <Plus size={20} />
            New Deployment
          </Link>
        </div>

        {/* Category Selection Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
          {[
            { id: 'all', label: 'All Operations' },
            { id: 'live', label: 'Live Operations' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Archived' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                background: filterStatus === tab.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'rgba(255,255,255,0.03)',
                color: filterStatus === tab.id ? 'white' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: filterStatus === tab.id ? '0 10px 20px -5px rgba(59, 130, 246, 0.5)' : 'none'
              }}
              onMouseEnter={e => {
                if (filterStatus !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={e => {
                if (filterStatus !== tab.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {tab.id === 'live' && <div style={{ width: '10px', height: '10px', background: filterStatus === 'live' ? 'white' : '#ef4444', borderRadius: '50%', boxShadow: filterStatus === 'live' ? '0 0 10px white' : '0 0 10px #ef4444', animation: 'pulse 1.5s infinite' }}></div>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="search-filter-bar" style={{ marginBottom: '2rem' }}>
          <div className="search-container" style={{ flex: 1 }}>
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by operation name or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="loading-state">Loading events...</div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid-full">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                {...event}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No events found</p>
            <p className="empty-state-subtitle">
              {searchTerm ? 'Try adjusting your search' : 'Create your first event to get started'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
