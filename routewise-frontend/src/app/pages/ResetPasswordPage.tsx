import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { MapPin, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { authAPI } from '../../utils/api';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match tactical parity');
    }
    if (!token) return toast.error('Invalid or missing reset token');

    setLoading(true);
    try {
      await authAPI.resetPassword(password, token);
      setSuccess(true);
      toast.success('Credentials updated successfully');
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
            <ShieldCheck color="#60a5fa" size={40} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0 }}>Restore <span style={{ color: '#60a5fa' }}>Access</span></h2>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', lineHeight: 1.5 }}>
            Initialize new secure credentials for your command account.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label className="form-label" style={{ color: '#93c5fd' }}>
                <Lock size={16} /> New Password
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label" style={{ color: '#93c5fd' }}>
                <Lock size={16} /> Confirm New Password
              </label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-button" disabled={loading} style={{ marginTop: '2.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              {loading ? <Loader2 className="animate-spin" /> : 'Update Credentials'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '2rem' }}>
               <h3 style={{ color: 'white', margin: 0 }}>Success</h3>
               <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Your tactical access has been restored.</p>
            </div>
            <Link to="/login" className="submit-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              Sign In <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
