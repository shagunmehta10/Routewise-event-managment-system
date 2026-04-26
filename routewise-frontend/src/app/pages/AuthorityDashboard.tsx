import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, AlertTriangle, CheckCircle, Clock, Building2, ShieldAlert, Check, X } from 'lucide-react';
import { venueAPI } from '../../utils/api';
import { toast } from 'sonner';
import '../styles/authority-dashboard.css';

export default function AuthorityDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'venues' | 'emergency'>('overview');
  const [venues, setVenues] = useState<any[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 24,
    activeEvents: 3,
    completedEvents: 18,
    pendingApprovals: 0, // Will be updated from venues
  });

  const fetchVenues = async () => {
    setLoadingVenues(true);
    try {
      const data = await venueAPI.getAllVenues();
      setVenues(data);
      const pending = data.filter((v: any) => !v.approved).length;
      setDashboardStats(prev => ({ ...prev, pendingApprovals: pending }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch venues');
    } finally {
      setLoadingVenues(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleApproveVenue = async (id: string) => {
    try {
      await venueAPI.approveVenue(id);
      toast.success('Venue approved successfully');
      fetchVenues();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const triggerEmergency = () => {
    toast.error('EMERGENCY ALERT BROADCASTED', {
      description: 'All nearby events notified to clear routes immediately.',
      duration: 5000,
    });
    // In real app, this would emit a socket event
  };

  // Mock data for charts
  const monthlyEventsData = [
    { month: 'Jan', events: 12 },
    { month: 'Feb', events: 15 },
    { month: 'Mar', events: 8 },
    { month: 'Apr', events: 18 },
    { month: 'May', events: 22 },
    { month: 'Jun', events: 20 },
  ];

  const eventTypeData = [
    { type: 'Baraat', count: 12 },
    { type: 'Marathon', count: 4 },
    { type: 'Parade', count: 3 },
    { type: 'Other', count: 5 },
  ];

  return (
    <div className="authority-dashboard-page">
      <Navbar />

      <main className="authority-main">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Authority Command Center</h1>
            <p className="page-subtitle">Civic oversight and emergency coordination</p>
          </div>
          <div className="tab-switcher" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <button onClick={() => setActiveTab('overview')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: activeTab === 'overview' ? '#3b82f6' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Overview</button>
             <button onClick={() => setActiveTab('venues')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: activeTab === 'venues' ? '#3b82f6' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Venues {dashboardStats.pendingApprovals > 0 && <span style={{ background: '#ef4444', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{dashboardStats.pendingApprovals}</span>}
             </button>
             <button onClick={() => setActiveTab('emergency')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: activeTab === 'emergency' ? '#ef4444' : 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Emergency</button>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="stats-overview">
              <div className="stat-card-large">
                <div className="stat-icon-large blue">
                  <Users size={32} />
                </div>
                <div className="stat-info">
                  <h3 className="stat-number">{dashboardStats.totalEvents}</h3>
                  <p className="stat-label">Total Events</p>
                </div>
              </div>

              <div className="stat-card-large">
                <div className="stat-icon-large green">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-info">
                  <h3 className="stat-number">{dashboardStats.activeEvents}</h3>
                  <p className="stat-label">Active Events</p>
                </div>
              </div>

              <div className="stat-card-large">
                <div className="stat-icon-large purple">
                  <Clock size={32} />
                </div>
                <div className="stat-info">
                  <h3 className="stat-number">{dashboardStats.completedEvents}</h3>
                  <p className="stat-label">Completed</p>
                </div>
              </div>

              <div className="stat-card-large">
                <div className="stat-icon-large orange">
                  <AlertTriangle size={32} />
                </div>
                <div className="stat-info">
                  <h3 className="stat-number">{dashboardStats.pendingApprovals}</h3>
                  <p className="stat-label">Pending Venue</p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
              <div className="chart-container">
                <h3 className="chart-title">Event Volume Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyEventsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3 className="chart-title">Route Compliance by Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="type" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'venues' && (
          <div className="venue-approvals-section" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2rem', marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Venue Route Accountability</h2>
            {loadingVenues ? <p>Loading venues...</p> : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {venues.length === 0 ? <p style={{ color: '#94a3b8' }}>No venues registered yet.</p> : venues.map(venue => (
                  <div key={venue.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{venue.name}</h4>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>{venue.address}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', background: venue.service_road_available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: venue.service_road_available ? '#10b981' : '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>
                            {venue.service_road_available ? 'Service Road ✓' : 'Internal Only'}
                          </span>
                          {venue.approved && <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>Approved</span>}
                        </div>
                      </div>
                    </div>
                    {!venue.approved ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleApproveVenue(venue.id)} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                          Approve <Check size={16} />
                        </button>
                        <button style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'default' }}>
                        Validated
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="emergency-protocol-section" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={48} className="pulse-red" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Emergency Priority Override</h2>
              <p style={{ color: '#94a3b8', marginBottom: '3rem', lineHeight: '1.6' }}>
                Triggering an emergency alert will instantly notify all active baraat processions within a 5km radius of emergency vehicle routes. Authorities can halt movement to ensure clear passage.
              </p>
              <button 
                onClick={triggerEmergency}
                style={{ padding: '1.5rem 3rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '1rem', fontSize: '1.25rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 15px 30px -10px rgba(239, 68, 68, 0.5)', transition: 'all 0.2s' }}
              >
                BROADCAST EMERGENCY ALERT
              </button>
              <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#60a5fa' }}>Active Ambulances</h4>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>02</p>
                 </div>
                 <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#f59e0b' }}>Incidents Today</h4>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>01</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

