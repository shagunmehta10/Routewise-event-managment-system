import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Building2, MapPin, CheckCircle2, ArrowLeft, Route } from 'lucide-react';
import { venueAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Navbar } from '../components/Navbar';

export default function VenueRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    service_road_available: false,
    internal_route: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }

    try {
      await venueAPI.registerVenue({ ...formData, user_id: user.id });
      toast.success('Venue registered! Awaiting authority approval.');
      navigate('/venues');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register venue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div
        className="live-bg-container"
        style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url("/dashboard_bg.png")' }}
      />
      <Navbar />

      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '620px' }}>

          <Link
            to="/user-dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              color: '#60a5fa', textDecoration: 'none', fontWeight: 800,
              fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.5px', textTransform: 'uppercase'
            }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="cool-glass-card" style={{ padding: '3rem', borderRadius: '2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '1.25rem', display: 'inline-flex', flexShrink: 0 }}>
                <Building2 color="#60a5fa" size={36} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'white', margin: 0 }}>
                  Venue <span style={{ color: '#60a5fa' }}>Registration</span>
                </h1>
                <p style={{ color: '#94a3b8', marginTop: '0.3rem', fontSize: '0.9rem' }}>
                  Partner with RouteWise to manage event logistics
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="event-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

              {/* Venue Name */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building2 size={14} /> Venue Name
                </label>
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <Building2 size={17} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Celebration Banquet"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    style={{ paddingLeft: '3.25rem' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} /> Official Address
                </label>
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <MapPin size={17} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="Street, Area, City"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="form-input"
                    style={{ paddingLeft: '3.25rem' }}
                  />
                </div>
              </div>

              {/* Service Road Toggle */}
              <div
                onClick={() => setFormData(p => ({ ...p, service_road_available: !p.service_road_available }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Service Road Infrastructure</h4>
                  <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    Does your venue provide direct service road access for processions?
                  </p>
                </div>
                <div style={{
                  width: '52px', height: '28px', borderRadius: '14px', flexShrink: 0, marginLeft: '1.5rem',
                  background: formData.service_road_available ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.3s'
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px',
                    left: formData.service_road_available ? '27px' : '3px',
                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }} />
                </div>
              </div>

              {/* Internal Route */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Route size={14} /> Internal Logistics Plan
                </label>
                <textarea
                  placeholder="Briefly describe the vehicle entry/exit points and internal paths..."
                  value={formData.internal_route}
                  onChange={e => setFormData({ ...formData, internal_route: e.target.value })}
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical', paddingTop: '1rem', marginTop: '0.5rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
                style={{ width: '100%', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem' }}
              >
                {loading ? 'Submitting Application...' : <><CheckCircle2 size={20} /> Submit for Approval</>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
