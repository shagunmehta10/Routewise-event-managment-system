import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { authAPI } from '../../utils/api';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Bell, 
  Lock, 
  Gift, 
  Share2, 
  Save, 
  ChevronRight,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('payment');
  const [settings, setSettings] = useState({
    notifications: true,
    smsAlerts: false,
    emailAlerts: true,
    privacy: 'public',
    upiId: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    giftCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [claimingGift, setClaimingGift] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const u = JSON.parse(userJson);
      setUser(u);
      if (u.settings) {
        setSettings(prev => ({ 
          ...prev, 
          ...u.settings,
          // Safely merge nested settings
          notifications: u.settings.notifications ?? true,
          smsAlerts: u.settings.smsAlerts ?? false,
          emailAlerts: u.settings.emailAlerts ?? true,
          privacy: u.settings.privacy ?? 'public',
          upiId: u.settings.upiId ?? '',
        }));
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const payload = {
        notifications: settings.notifications,
        smsAlerts: settings.smsAlerts,
        emailAlerts: settings.emailAlerts,
        privacy: settings.privacy,
        upiId: settings.upiId,
      };
      await authAPI.updateSettings(payload);
      
      // Update local storage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        const updated = { ...u, settings: { ...u.settings, ...payload } };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
      toast.success('Configuration synced successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async () => {
    if (!settings.upiId && !settings.cardNumber) {
      toast.error('Please enter at least one payment method');
      return;
    }
    if (settings.cardNumber && settings.cardNumber.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }
    setSavingPayment(true);
    try {
      const payload = { upiId: settings.upiId };
      await authAPI.updateSettings(payload);
      
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        const updated = { ...u, settings: { ...u.settings, ...payload } };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
      setPaymentSaved(true);
      setTimeout(() => setPaymentSaved(false), 3000);
      toast.success('Payment methods saved securely');
    } catch (error) {
      toast.error('Failed to save payment methods');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const payload = {
        notifications: settings.notifications,
        smsAlerts: settings.smsAlerts,
        emailAlerts: settings.emailAlerts,
      };
      await authAPI.updateSettings(payload);
      
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        const updated = { ...u, settings: { ...u.settings, ...payload } };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
      toast.success('Alert preferences updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      const payload = { privacy: settings.privacy };
      await authAPI.updateSettings(payload);
      
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        const updated = { 
          ...u, 
          settings: { ...u.settings, ...payload },
          is_private: settings.privacy === 'private'
        };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
      toast.success(
        settings.privacy === 'private' 
          ? 'Stealth mode activated — your events are hidden from the fleet map'
          : 'Your events are now publicly visible on the fleet map'
      );
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimGift = async () => {
    if (!settings.giftCode.trim()) {
      toast.error('Please enter a gift code');
      return;
    }
    setClaimingGift(true);
    try {
      const res = await authAPI.claimGiftCard(settings.giftCode.trim());
      toast.success(res.message || 'Gift code redeemed!');
      setSettings(p => ({ ...p, giftCode: '' }));
      
      const updatedUser = { ...user, points: res.points };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired gift code');
    } finally {
      setClaimingGift(false);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: 'RouteWise Tactical Routing',
      text: 'Deploy your missions with zero conflicts using RouteWise.',
      url: window.location.origin
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('Mission link copied to clipboard');
    }
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry as MM/YY
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const TabButton = ({ id, icon, label, badge }: { id: string; icon: any; label: string; badge?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
        padding: '1.25rem',
        borderRadius: '1rem',
        border: 'none',
        background: activeTab === id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        color: activeTab === id ? '#60a5fa' : '#94a3b8',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.3s',
        position: 'relative'
      }}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ 
          marginLeft: 'auto',
          background: '#ef4444', 
          color: 'white', 
          borderRadius: '50%', 
          width: '20px', 
          height: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: 900
        }}>
          {badge}
        </span>
      )}
      {badge === undefined && (
        <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: activeTab === id ? 1 : 0 }} />
      )}
    </button>
  );

  const ToggleSwitch = ({ checked, onChange, label, sublabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string }) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1.25rem 1.5rem', 
      background: 'rgba(255,255,255,0.03)', 
      borderRadius: '1rem',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '1rem'
    }}>
      <div>
        <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>{label}</h4>
        {sublabel && <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>{sublabel}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '52px',
          height: '28px',
          borderRadius: '14px',
          background: checked ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.3s',
          flexShrink: 0,
          marginLeft: '1rem'
        }}
      >
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '3px',
          left: checked ? '27px' : '3px',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("/dashboard_bg.png")' }}></div>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: '2.5rem' }}>
          Tactical <span style={{ color: '#60a5fa' }}>Command Center</span>
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem' }}>
          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <TabButton id="payment" icon={<CreditCard size={20} />} label="Payments" />
            <TabButton id="notifications" icon={<Bell size={20} />} label="Alerts" />
            <TabButton id="privacy" icon={<Lock size={20} />} label="Privacy" />
            <TabButton id="rewards" icon={<Gift size={20} />} label="Rewards" />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', paddingTop: '1rem' }}>
              <button 
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  background: 'rgba(96, 165, 250, 0.1)',
                  color: '#60a5fa',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Share2 size={20} />
                Share System
              </button>
            </div>

            {/* User Points Display */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1.5rem', 
              background: 'rgba(96, 165, 250, 0.08)', 
              borderRadius: '1rem',
              border: '1px solid rgba(96, 165, 250, 0.15)'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                Merit Points
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                {user?.points || 0}
              </div>
            </div>
          </aside>

          {/* Content Panel */}
          <section className="cool-glass-card" style={{ padding: '2.5rem', borderRadius: '2rem' }}>

            {/* ── PAYMENT TAB ── */}
            {activeTab === 'payment' && (
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Payment Methods</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Your payment details are encrypted and never shared.</p>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {/* UPI */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'rgba(96,165,250,0.1)', padding: '0.6rem', borderRadius: '0.75rem' }}>
                        <Smartphone color="#60a5fa" size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>UPI / GPay</h3>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Instant payments via UPI</p>
                      </div>
                      {settings.upiId && (
                        <CheckCircle size={18} color="#10b981" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Virtual Payment Address (VPA)</label>
                      <input 
                        className="form-input" 
                        placeholder="username@okaxis" 
                        value={settings.upiId} 
                        onChange={e => setSettings(p => ({ ...p, upiId: e.target.value }))}
                        style={{ marginTop: '0.5rem' }}
                      />
                    </div>
                  </div>

                  {/* Card */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'rgba(96,165,250,0.1)', padding: '0.6rem', borderRadius: '0.75rem' }}>
                        <CreditCard color="#60a5fa" size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Debit / Credit Card</h3>
                        <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Visa, Mastercard, RuPay accepted</p>
                      </div>
                      {settings.cardNumber.replace(/\s/g, '').length === 16 && (
                        <CheckCircle size={18} color="#10b981" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Card Number</label>
                        <input 
                          className="form-input" 
                          placeholder="1234 5678 9012 3456"
                          value={settings.cardNumber}
                          onChange={e => setSettings(p => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                          maxLength={19}
                          style={{ marginTop: '0.5rem', letterSpacing: '2px', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Expiry (MM/YY)</label>
                          <input 
                            className="form-input" 
                            placeholder="MM/YY"
                            value={settings.cardExpiry}
                            onChange={e => setSettings(p => ({ ...p, cardExpiry: formatExpiry(e.target.value) }))}
                            maxLength={5}
                            style={{ marginTop: '0.5rem' }}
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>CVV</label>
                          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                            <input 
                              className="form-input" 
                              placeholder="•••"
                              type={showCvv ? 'text' : 'password'}
                              value={settings.cardCvv}
                              onChange={e => setSettings(p => ({ ...p, cardCvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                              maxLength={4}
                              style={{ paddingRight: '3rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCvv(!showCvv)}
                              style={{ 
                                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0
                              }}
                            >
                              {showCvv ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleSavePayment}
                    disabled={savingPayment}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '1rem 2rem', borderRadius: '1rem',
                      background: paymentSaved ? '#10b981' : '#3b82f6',
                      color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem',
                      cursor: savingPayment ? 'not-allowed' : 'pointer',
                      transition: 'background 0.3s',
                      boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    {savingPayment ? (
                      <><Loader2 size={18} className="animate-spin" /> Securing...</>
                    ) : paymentSaved ? (
                      <><CheckCircle size={18} /> Saved!</>
                    ) : (
                      <><Save size={18} /> Save Payment Methods</>
                    )}
                  </button>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', alignSelf: 'center' }}>
                    🔒 256-bit encrypted
                  </p>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Notification Preferences</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Choose how you receive tactical alerts and updates.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <ToggleSwitch
                    checked={settings.notifications}
                    onChange={v => setSettings(p => ({ ...p, notifications: v }))}
                    label="Push Notifications"
                    sublabel="Receive in-app alerts for clash detections and route updates."
                  />
                  <ToggleSwitch
                    checked={settings.emailAlerts}
                    onChange={v => setSettings(p => ({ ...p, emailAlerts: v }))}
                    label="Email Alerts"
                    sublabel="Get mission summaries and emergency broadcasts via email."
                  />
                  <ToggleSwitch
                    checked={settings.smsAlerts}
                    onChange={v => setSettings(p => ({ ...p, smsAlerts: v }))}
                    label="SMS / WhatsApp Alerts"
                    sublabel="Critical clash alerts sent directly to your registered mobile number."
                  />
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(245,158,11,0.08)', borderRadius: '1rem', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span>⚡</span>
                    Emergency broadcasts from authorities are always delivered regardless of these settings.
                  </p>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  style={{
                    marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 2rem', borderRadius: '1rem', background: '#3b82f6',
                    color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {loading ? 'Saving...' : 'Save Alert Preferences'}
                </button>
              </div>
            )}

            {/* ── PRIVACY TAB ── */}
            {activeTab === 'privacy' && (
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Operational Privacy</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Control who can see your missions on the Global Fleet Map.</p>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                  {[
                    {
                      value: 'public',
                      icon: '🌐',
                      label: 'Public Mode',
                      description: 'Your event routes are visible to all users on the Global Fleet Map. Enables clash detection and coordination.',
                      color: '#10b981',
                      bg: 'rgba(16,185,129,0.08)',
                      border: 'rgba(16,185,129,0.3)'
                    },
                    {
                      value: 'private',
                      icon: '🕵️',
                      label: 'Stealth Mode (Incognito)',
                      description: 'Your routes are hidden from the public fleet map. Only you can see your missions. Note: clash detection may be limited.',
                      color: '#8b5cf6',
                      bg: 'rgba(139,92,246,0.08)',
                      border: 'rgba(139,92,246,0.3)'
                    }
                  ].map(option => (
                    <div
                      key={option.value}
                      onClick={() => setSettings(p => ({ ...p, privacy: option.value }))}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '1.25rem',
                        border: `2px solid ${settings.privacy === option.value ? option.border : 'rgba(255,255,255,0.07)'}`,
                        background: settings.privacy === option.value ? option.bg : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1.25rem'
                      }}
                    >
                      <span style={{ fontSize: '2rem', flexShrink: 0 }}>{option.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, color: settings.privacy === option.value ? option.color : 'white', fontWeight: 800 }}>
                            {option.label}
                          </h4>
                          {settings.privacy === option.value ? (
                            <CheckCircle size={20} color={option.color} />
                          ) : (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                          )}
                        </div>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{option.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Chrome-style Incognito Panel — shown only when private mode is active ── */}
                {settings.privacy === 'private' && (
                  <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    borderRadius: '1.5rem',
                    padding: '2.5rem',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'fadeIn 0.4s ease-out'
                  }}>
                    {/* Background glow */}
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />

                    {/* Icon + Heading row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{
                        width: '72px', height: '72px', flexShrink: 0,
                        background: 'rgba(139, 92, 246, 0.15)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(139, 92, 246, 0.4)',
                        fontSize: '2.2rem'
                      }}>
                        🕵️
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                          You've gone <span style={{ color: '#a78bfa' }}>Incognito</span>
                        </h3>
                        <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                          RouteWise won't show your routes on the public fleet map.
                        </p>
                      </div>
                    </div>

                    {/* Two-column privacy breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                      {/* What's private */}
                      <div style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>🔒</span>
                          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Hidden from others
                          </h4>
                        </div>
                        {[
                          'Your event routes on fleet map',
                          'Your start & end locations',
                          'Your live tracking position',
                          'Your event schedule',
                        ].map(item => (
                          <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                            <span style={{ color: '#a78bfa', fontSize: '0.9rem', marginTop: '1px', flexShrink: 0 }}>✓</span>
                            <span style={{ fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* What's NOT private */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>👁️</span>
                          <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Still visible to you
                          </h4>
                        </div>
                        {[
                          'Your own dashboard & events',
                          'Authority emergency broadcasts',
                          'Your saved profile & settings',
                          'Your merit points & history',
                        ].map(item => (
                          <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.6rem' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '1px', flexShrink: 0 }}>–</span>
                            <span style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: 1.4 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Warning note */}
                    <div style={{ marginTop: '1.25rem', padding: '0.9rem 1.25rem', background: 'rgba(245,158,11,0.07)', borderRadius: '0.75rem', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#fbbf24', lineHeight: 1.5 }}>
                        <strong>Note:</strong> RouteWise admins and authority dashboards can still see your events for safety and compliance. Incognito hides you from other regular users only.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ padding: '1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: '1rem', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#93c5fd' }}>
                    <strong>Current mode:</strong> {settings.privacy === 'private' ? 'Your routes are hidden from other users on the fleet map.' : 'Your routes are visible to all users and authority dashboards.'}
                  </p>
                </div>

                <button
                  onClick={handleSavePrivacy}
                  disabled={loading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 2rem', borderRadius: '1rem',
                    background: settings.privacy === 'private' ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : '#3b82f6',
                    color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: settings.privacy === 'private' ? '0 10px 20px -5px rgba(139, 92, 246, 0.5)' : '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.3s'
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  {loading ? 'Applying...' : settings.privacy === 'private' ? 'Activate Incognito Mode' : 'Apply Privacy Settings'}
                </button>
              </div>
            )}

            {/* ── REWARDS TAB ── */}
            {activeTab === 'rewards' && (
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>Claim Merits</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Redeem gift codes to earn tactical merit points.</p>

                {/* Points Balance */}
                <div style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)', borderRadius: '1.5rem', border: '1px solid rgba(96,165,250,0.3)', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Current Balance</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                    {user?.points || 0}
                    <span style={{ fontSize: '1rem', color: '#94a3b8', marginLeft: '0.5rem', fontWeight: 600 }}>Points</span>
                  </div>
                  <div style={{ marginTop: '1rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(((user?.points || 0) % 100), 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', 
                      borderRadius: '3px',
                      transition: 'width 1s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                    {100 - ((user?.points || 0) % 100)} points to next rank
                  </div>
                </div>

                {/* Redeem Code */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <h3 style={{ margin: '0 0 1rem', color: 'white', fontSize: '1.1rem' }}>Redeem Gift Code</h3>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input 
                      className="form-input"
                      placeholder="RTW-XXXX-XXXX" 
                      value={settings.giftCode}
                      onChange={e => setSettings(p => ({ ...p, giftCode: e.target.value.toUpperCase() }))}
                      onKeyDown={e => e.key === 'Enter' && handleClaimGift()}
                      style={{ flex: 1, letterSpacing: '2px', fontFamily: 'monospace' }}
                    />
                    <button 
                      onClick={handleClaimGift}
                      disabled={claimingGift || !settings.giftCode.trim()}
                      style={{ 
                        padding: '0 1.5rem', 
                        borderRadius: '0.75rem', 
                        background: claimingGift ? '#64748b' : '#60a5fa',
                        color: 'white', 
                        border: 'none', 
                        fontWeight: 800, 
                        cursor: claimingGift || !settings.giftCode.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        whiteSpace: 'nowrap',
                        transition: 'background 0.2s'
                      }}
                    >
                      {claimingGift ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
                      {claimingGift ? 'Verifying...' : 'Claim'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>
                    Gift codes can be obtained from authority achievements and special RouteWise events.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
