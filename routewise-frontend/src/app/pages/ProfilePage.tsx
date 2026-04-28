import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  User, Mail, Shield, Award, Calendar, MapPin, 
  History, TrendingUp, Zap, Clock, ArrowRight, Star, Camera
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { authAPI, eventAPI } from '../../utils/api';
import { Navbar } from '../components/Navbar';
import { toast } from 'sonner';
import '../styles/dashboard.css';

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await authAPI.getProfile();
        setUser(userData);
        const events = await eventAPI.getAllEvents(userData.id);
        setHistory(events);
      } catch (err) {
        console.error("Failed to load profile:", err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !clerkUser) return;

    try {
      setLoading(true);
      
      // Update the profile image in Clerk
      await clerkUser.setProfileImage({ file });
      
      // Sync the new Clerk profile image to our backend
      await authAPI.syncUser(clerkUser);
      
      // Refresh local user state from backend
      const userData = await authAPI.getProfile();
      setUser(userData);
      
      toast.success('Tactical avatar updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update avatar in system');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url("/landing_bg.png")' }}></div>
      <Navbar />
      
      <main style={{ padding: '3rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '2.5rem',
          padding: '4rem 3rem',
          color: 'white',
          marginBottom: '3rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Decorative background elements */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            {/* Avatar with camera overlay */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ 
                width: '140px', 
                height: '140px', 
                borderRadius: '2.5rem', 
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                border: '6px solid rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}>
                {clerkUser?.imageUrl || user?.avatar_url ? (
                  <img src={clerkUser?.imageUrl || user?.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={70} color="#1e40af" />
                )}
              </div>
              {/* Camera upload badge */}
              <label
                htmlFor="avatar-upload"
                title="Change profile photo"
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  background: '#3b82f6',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.6)',
                  border: '3px solid #1e293b',
                  transition: 'transform 0.2s, background 0.2s',
                  zIndex: 10,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Camera size={18} />
                <input id="avatar-upload" type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
              </label>
            </div>
            <div>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{clerkUser?.fullName || clerkUser?.firstName || user?.name || 'Commander Profile'}</h1>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span className="live-info-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Mail size={16} /> {clerkUser?.primaryEmailAddress?.emailAddress || user?.email}
                </span>
                <span className="live-info-badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Shield size={16} /> {user?.role === 'admin' ? 'Strategic Administrator' : 'Field Operator'}
                </span>
              </div>
            </div>
          </div>
        </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
            {/* Left Column: Stats & Rewards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <div className="cool-glass-card" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={24} /> Merits
                </h2>
                <Award size={24} color="#f59e0b" />
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ fontSize: '4rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.5rem', letterSpacing: '-2px' }}>{user?.points || 0}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>ACCUMULATED FIELD SCORE</div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 700, color: '#cbd5e1' }}>PROMOTION PROGRESS</span>
                  <span style={{ color: '#60a5fa', fontWeight: 800 }}>{((user?.points || 0) % 100)}%</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(user?.points || 0) % 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                    borderRadius: '6px',
                    transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}></div>
                </div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div style={{ background: '#bae6fd', padding: '0.75rem', borderRadius: '1rem' }}>
                  <Zap size={20} color="#0369a1" />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0369a1' }}>Next Milestone</div>
                  <div style={{ fontSize: '0.8rem', color: '#0e7490', fontWeight: 600 }}>{100 - ((user?.points || 0) % 100)} points to Specialist rank</div>
                </div>
              </div>
            </div>

              <div className="cool-glass-card" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <TrendingUp size={24} /> Field Commendations
                </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {[
                  { icon: <Zap size={24} />, label: 'Fast Response', color: '#ef4444', bg: '#fee2e2' },
                  { icon: <Star size={24} />, label: 'Elite Tracker', color: '#3b82f6', bg: '#dbeafe' },
                  { icon: <Shield size={24} />, label: 'Safety First', color: '#10b981', bg: '#d1fae5' }
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: item.bg, color: item.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      {item.icon}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

            {/* Right Column: Event History */}
            <div className="cool-glass-card" style={{ padding: '3rem', borderRadius: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <History size={32} /> Mission Logs
              </h2>
              <Link to="/events" className="nav-link" style={{ fontSize: '0.95rem', fontWeight: 900, color: '#3b82f6' }}>ARCHIVE ACCESS</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {['Live', 'Upcoming', 'Completed'].map((cat) => {
                const categoryEvents = history.filter(ev => {
                  const status = eventAPI.getLiveStatus(ev);
                  return status.toLowerCase() === cat.toLowerCase();
                });

                if (categoryEvents.length === 0) return null;

                return (
                  <div key={cat}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: cat === 'Live' ? '#ef4444' : '#94a3b8', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {cat === 'Live' && <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span>}
                      {cat} OPERATIONS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {categoryEvents.map((ev) => (
                        <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1.5rem', 
                            padding: '1.5rem',
                            borderRadius: '1.25rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: 'rgba(255, 255, 255, 0.03)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.transform = 'translateX(8px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.1)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          >
                            <div style={{ 
                              width: '64px', height: '64px', background: cat === 'Live' ? '#fee2e2' : '#f1f5f9',
                              borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '64px'
                            }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: cat === 'Live' ? '#ef4444' : '#1e3a8a' }}>
                                {new Date(ev.date).getDate()}
                              </span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                {new Date(ev.date).toLocaleString('default', { month: 'short' })}
                              </span>
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.4rem' }}>{ev.name}</h3>
                              <div style={{ display: 'flex', gap: '1.25rem', color: '#94a3b8', fontSize: '0.9rem', flexWrap: 'wrap', fontWeight: 500 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <MapPin size={16} color="#60a5fa" /> {ev.startLocation} ➔ {ev.endLocation}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Clock size={16} color="#60a5fa" /> {ev.startTime}
                                </span>
                              </div>
                            </div>

                            <ArrowRight size={20} color="#cbd5e1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {history.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 0', background: '#f8fafc', borderRadius: '1.5rem', border: '2px dashed #e2e8f0' }}>
                  <Calendar size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
                  <p style={{ fontWeight: 800, color: '#94a3b8' }}>NO OPERATIONAL HISTORY FOUND</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
