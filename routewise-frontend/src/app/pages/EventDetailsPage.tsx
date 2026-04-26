import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { eventAPI, routeAPI, paymentAPI } from '../../utils/api';
import { Calendar, MapPin, ArrowLeft, Clock, AlertTriangle, Edit, Coins, Trash2, Smartphone, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { RouteMap } from '../components/RouteMap';

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; geometry: [number, number][] } | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [activeRouteIdx, setActiveRouteIdx] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [payingPenalty, setPayingPenalty] = useState(false);
  const [routeOptions] = useState({ 
    avoidTolls: false, 
    avoidHighways: false, 
    preference: 'fastest' as 'fastest' | 'shortest' 
  });

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return;
      try {
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        
        const [data, allRaw] = await Promise.all([
          eventAPI.getEventById(id),
          eventAPI.getAllEvents(user?.id)
        ]);
        
        const processedEvents = eventAPI.detectClashes(allRaw);
        const thisEventWithClash = processedEvents.find((e: any) => String(e.id) === String(id));
        
        const eventData = thisEventWithClash || data;

        if (!eventData.startCoords || !eventData.endCoords) {
          try {
            const start = eventData.startCoords || await routeAPI.geocodeLocation(eventData.startLocation);
            const end = eventData.endCoords || await routeAPI.geocodeLocation(eventData.endLocation);
            setEvent({
              ...eventData,
              startCoords: start || [30.3165 + (Math.random() * 0.05), 78.0322 + (Math.random() * 0.05)],
              endCoords: end || [30.3165 + (Math.random() * 0.05), 78.0322 + (Math.random() * 0.05)]
            });
          } catch {
            setEvent({ ...eventData, startCoords: [30.3165, 78.0322], endCoords: [30.33, 78.05] });
          }
        } else {
          setEvent(eventData);
        }
        
        if (eventData.startCoords && eventData.endCoords) {
          const altData = await routeAPI.getOSRMAlternatives(eventData.startCoords, eventData.endCoords, routeOptions);
          if (altData && altData.routes) {
            setAlternatives(altData.routes);
            setRouteInfo(altData.routes[activeRouteIdx] || altData.routes[0]);
          }
        }
      } catch (err) {
        console.error('Data sync error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
    const interval = setInterval(fetchEventData, 10000); 
    return () => clearInterval(interval);
  }, [id, routeOptions, activeRouteIdx]);

  useEffect(() => {
    if (alternatives[activeRouteIdx]) {
      setRouteInfo(alternatives[activeRouteIdx]);
    }
  }, [activeRouteIdx, alternatives]);

  // ── Correct delete with modal confirmation ──
  const handleDeleteClick = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await eventAPI.deleteEvent(id);
      toast.success('Mission aborted and removed');
      setShowDeleteModal(false);
      navigate('/events');
    } catch (error) {
      toast.error('Failed to abort mission. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePayPenalty = async (method: string) => {
    if (!id) return;
    setPayingPenalty(true);
    try {
      await paymentAPI.payPenalty(id, 5000, method);
      setEvent((prev: any) => ({ ...prev, mustDivert: false, penalty_paid: true }));
      toast.success(`₹5,000 surcharge cleared via ${method === 'upi' ? 'GPay/UPI' : 'Card'}`);
    } catch (error) {
      toast.error('Payment failed. Please check your payment details in Settings.');
    } finally {
      setPayingPenalty(false);
    }
  };

  const liveStatus = eventAPI.getLiveStatus(event);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
      <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderLeftColor: '#3b82f6', borderRadius: '50%', width: '44px', height: '44px', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );
  
  if (!event) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2>Mission not found</h2>
        <Link to="/events" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Return to Archives</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', position: 'relative' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url("/dashboard_bg.png")' }}></div>
      <Navbar />

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#1e293b', borderRadius: '1.5rem',
            padding: '2.5rem', maxWidth: '480px', width: '100%',
            border: '1px solid rgba(239,68,68,0.3)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: '64px', height: '64px', 
                background: 'rgba(239,68,68,0.1)', 
                borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Trash2 size={28} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '0 0 0.75rem' }}>
                Abort Mission?
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                This will permanently delete <strong style={{ color: 'white' }}>"{event.name}"</strong> and all associated route data. This action cannot be undone.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', fontSize: '0.85rem', 
                color: '#94a3b8', marginBottom: '0.6rem', fontWeight: 600
              }}>
                Type <span style={{ color: '#ef4444', fontFamily: 'monospace', fontWeight: 900 }}>ABORT</span> to confirm:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ABORT"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                style={{ 
                  fontFamily: 'monospace', letterSpacing: '4px', 
                  textAlign: 'center', fontSize: '1.1rem',
                  borderColor: deleteConfirmText === 'ABORT' ? '#ef4444' : undefined
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1, padding: '0.9rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
                }}
              >
                <X size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== 'ABORT' || deleting}
                style={{
                  flex: 1, padding: '0.9rem', borderRadius: '0.75rem',
                  border: 'none',
                  background: deleteConfirmText === 'ABORT' && !deleting 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'rgba(239,68,68,0.3)',
                  color: deleteConfirmText === 'ABORT' ? 'white' : '#94a3b8',
                  fontWeight: 800, fontSize: '0.95rem',
                  cursor: deleteConfirmText !== 'ABORT' || deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: deleteConfirmText === 'ABORT' ? '0 10px 20px -5px rgba(239,68,68,0.4)' : 'none'
                }}
              >
                {deleting ? 'Aborting...' : '⚠ Confirm Abort'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Top Nav Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/events" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={18} /> Mission Archives
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to={`/events/${id}/edit`}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)', color: 'white',
                textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
                transition: 'all 0.2s'
              }}
            >
              <Edit size={16} /> Edit Mission
            </Link>
            <button
              onClick={handleDeleteClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
              }}
            >
              <Trash2 size={16} /> Abort Mission
            </button>
          </div>
        </div>

        {/* Priority Clearance / Penalty Panel */}
        {event?.mustDivert && (
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            border: '2px solid rgba(245,158,11,0.4)',
            padding: '1.5rem 2rem',
            borderRadius: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(245,158,11,0.15)', padding: '0.75rem', borderRadius: '1rem', flexShrink: 0 }}>
                <Coins size={28} color="#f59e0b" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
                  Priority Routing Surcharge
                </h4>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  Scheduled during high-congestion period. Coordinated clearance fee applies.
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Amount Due
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', marginBottom: '0.75rem' }}>₹ 5,000</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => handlePayPenalty('upi')}
                  disabled={payingPenalty}
                  style={{ 
                    background: '#f59e0b', color: 'white', border: 'none',
                    padding: '0.6rem 1.1rem', borderRadius: '0.6rem',
                    fontWeight: 800, cursor: payingPenalty ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <Smartphone size={15} /> {payingPenalty ? 'Processing...' : 'Pay via GPay'}
                </button>
                <button 
                  onClick={() => handlePayPenalty('card')}
                  disabled={payingPenalty}
                  style={{ 
                    background: '#92400e', color: 'white', border: 'none',
                    padding: '0.6rem 1.1rem', borderRadius: '0.6rem',
                    fontWeight: 800, cursor: payingPenalty ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}
                >
                  <CreditCard size={15} /> {payingPenalty ? 'Processing...' : 'Pay via Card'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Penalty Paid Success Banner */}
        {event?.penalty_paid && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
            padding: '1rem 1.5rem', borderRadius: '1rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <CheckCircle size={20} color="#10b981" />
            <span style={{ color: '#10b981', fontWeight: 700 }}>Surcharge cleared — Route priority restored.</span>
          </div>
        )}

        {/* Main Card */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)',
          borderRadius: '1.5rem', padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)', color: 'white'
        }}>
          {/* Header */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', margin: 0, flex: 1 }}>{event.name}</h1>
              <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                {event.clashing && (
                  <div style={{ padding: '0.5rem 1rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={14} /> Route Clash
                  </div>
                )}
                <div style={{ 
                  padding: '0.5rem 1.25rem', borderRadius: '9999px',
                  background: liveStatus === 'live' ? '#ef4444' : liveStatus === 'upcoming' ? '#3b82f6' : '#64748b',
                  color: 'white', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase'
                }}>
                  {liveStatus}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <Calendar size={18} color="#3b82f6" /> {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <Clock size={18} color="#3b82f6" /> {event.startTime} — {event.endTime || 'TBD'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                <MapPin size={18} color="#3b82f6" /> {event.startLocation}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.75rem' }}>Mission Briefing</h3>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.7', margin: '0 0 2rem' }}>{event.description}</p>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', marginBottom: '1rem' }}>
                Tactical Map
              </h3>
              {/* RouteMap uses Leaflet / OpenStreetMap tiles directly - always works */}
              <RouteMap 
                startCoords={event.startCoords} 
                endCoords={event.endCoords} 
                eventType={event.eventType} 
                routes={alternatives}
                activeRouteIdx={activeRouteIdx}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Fleet Metrics */}
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa', marginBottom: '1rem' }}>Fleet Metrics</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Sector Overlap</span>
                    <span style={{ color: event.clashing ? '#ef4444' : '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>{event.clashing ? 'HIGH ⚠' : 'CLEAR ✓'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Priority Status</span>
                    <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '0.9rem' }}>{event.eventType?.toUpperCase() || 'STANDARD'}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>Route Telemetry</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Distance</span>
                      <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>{routeInfo?.distance || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>ETA</span>
                      <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.85rem' }}>{routeInfo?.duration || '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Destination</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right', maxWidth: '160px' }}>{event.endLocation}</span>
                  </div>
                </div>
              </div>

              {/* Route Options */}
              {alternatives.length > 1 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa', marginBottom: '1rem' }}>Route Options</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {alternatives.map((alt, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setActiveRouteIdx(idx)}
                        style={{
                          padding: '1rem',
                          borderRadius: '1rem',
                          border: '2px solid',
                          borderColor: activeRouteIdx === idx ? '#3b82f6' : 'rgba(255,255,255,0.07)',
                          background: activeRouteIdx === idx ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.25s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: activeRouteIdx === idx ? '#60a5fa' : '#ffffff' }}>
                            {idx === 0 ? '🥇 Primary Route' : `🔀 Alternate ${idx}`}
                          </span>
                          {idx === 0 && event.clashing && (
                            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 900, background: 'rgba(239,68,68,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                              CLASH
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                          {alt.distance} · {alt.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Import CreditCard locally since we use it in this file
function CreditCard({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  );
}
