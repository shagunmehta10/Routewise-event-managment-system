import { useState } from 'react';
import { Link } from 'react-router';
import { MapPin, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.link) setResetLink(res.link);
      setSubmitted(true);
      toast.success('Tactical reset link dispatched');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("/login_bg.png")' }}></div>
      
      <div className="cool-glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderRadius: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1.25rem', display: 'inline-flex', marginBottom: '1.5rem' }}>
            <MapPin color="#60a5fa" size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>Reset <span style={{ color: '#60a5fa' }}>Credentials</span></h2>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Enter your operational email to receive a secure mission reset link.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label className="form-label" style={{ color: '#93c5fd' }}>
                <Mail size={16} /> Operational Email
              </label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="commander@routewise.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading} style={{ marginTop: '2rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              {loading ? <Loader2 className="animate-spin" /> : 'Dispatch Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '2rem' }}>
              <CheckCircle size={40} color="#10b981" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', margin: 0 }}>Link Dispatched</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Check your inbox or use the tactical link below:
              </p>
              {resetLink && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: '1px dashed #10b981', overflowWrap: 'break-word' }}>
                  <a href={resetLink} style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                    {resetLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
