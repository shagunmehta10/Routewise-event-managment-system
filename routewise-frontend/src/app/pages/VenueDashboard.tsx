import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { venueAPI } from '../../utils/api';
import { 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Search, 
  Plus, 
  ExternalLink,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface Venue {
  id: number;
  name: string;
  address: string;
  approved: boolean;
  capacity?: number;
  contact?: string;
  type?: string;
}

export default function VenueDashboard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const data = await venueAPI.getAllVenues();
      setVenues(data);
    } catch (error) {
      toast.error('Tactical failure: Could not retrieve venue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("/dashboard_bg.png")' }}></div>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: 0 }}>Venue <span style={{ color: '#60a5fa' }}>Intelligence Dashboard</span></h1>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Operational monitoring and clearance status of mission-approved zones.</p>
          </div>
          <button 
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '1rem 2rem', 
              borderRadius: '1rem', 
              fontWeight: 800, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
            }}
          >
            <Plus size={20} /> Register New Venue
          </button>
        </div>

        <div className="search-container" style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={20} color="#60a5fa" />
          <input 
            type="text" 
            placeholder="Search tactical zones..." 
            style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '1rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', animation: 'pulse 2s infinite' }}></div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredVenues.map(venue => (
              <div key={venue.id} className="cool-glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ background: venue.approved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '1rem' }}>
                    <Shield size={24} color={venue.approved ? '#10b981' : '#f59e0b'} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '0.5rem', 
                      fontSize: '0.7rem', 
                      fontWeight: 900, 
                      textTransform: 'uppercase',
                      background: venue.approved ? '#10b981' : '#f59e0b',
                      color: 'white',
                      boxShadow: venue.approved ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(245, 158, 11, 0.3)'
                    }}>
                      {venue.approved ? 'Cleared' : 'Pending'}
                    </span>
                    {/* Simulated Authority Approval Toggle */}
                    <button 
                      onClick={async () => {
                        try {
                          await venueAPI.approveVenue(venue.id.toString());
                          fetchVenues();
                          toast.success(`${venue.name} clearance updated`);
                        } catch (e) { toast.error('Clearance failure'); }
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {venue.approved ? 'Revoke' : 'Authorize'}
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>{venue.name}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} /> {venue.address}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    <div style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.65rem', marginBottom: '0.25rem' }}>Clearance ID</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>RTW-VN-{venue.id.toString().padStart(4, '0')}</div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    <div style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.65rem', marginBottom: '0.25rem' }}>Type</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{venue.type || 'Event Zone'}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Info size={16} /> Details
                  </button>
                  <button style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ExternalLink size={16} /> Locate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {venues.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <AlertCircle size={60} color="#64748b" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>No Tactical Zones Found</h3>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Register a venue to initialize mission checkpoints.</p>
          </div>
        )}
      </main>
    </div>
  );
}
