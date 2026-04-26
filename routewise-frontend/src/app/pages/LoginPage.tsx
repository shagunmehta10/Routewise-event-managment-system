import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { MapPin, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { authAPI, systemAPI } from '../../utils/api';
import { toast } from 'sonner';

import '../styles/dashboard.css';
import '../styles/create-event.css';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Check backend health on mount
  useEffect(() => {
    let checked = false;
    const checkLive = async () => {
      if (checked) return;
      checked = true;
      const health = await systemAPI.checkHealth();
      if (health.status === 'error') {
        toast.error('Backend Connection Error', {
          description: 'Please start your server on port 5000',
          id: 'backend-offline',
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              toast.dismiss('backend-offline');
              checkLive();
            }
          }
        });
      }
    };
    checkLive();
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await authAPI.register({ name, email, password });
      } else {
        await authAPI.login({ email, password });
      }
      navigate('/create-event');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
        setError("Backend server is offline. Please start the backend on port 5000.");
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("/login_bg.png")' }}></div>
      <div className="create-event-card" style={{ 
        width: '100%', 
        maxWidth: '450px', 
        padding: '3rem',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            borderRadius: '1rem', 
            backgroundColor: 'rgba(0, 166, 126, 0.1)',
            marginBottom: '1rem' 
          }}>
            <MapPin color="#00A67E" size={40} />
          </div>
          <h2 className="card-title" style={{ fontSize: '2rem', color: 'white' }}>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            {isSignUp ? 'Sign up to manage your events and routes' : 'Sign in to manage your events and routes'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="event-form">
          {error && (
            <div style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: '#fca5a5', 
              padding: '1rem', 
              borderRadius: '1rem', 
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                Name
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginTop: isSignUp ? '1.5rem' : '0' }}>
            <label className="form-label">
              <Mail size={16} /> 
              Email Address
            </label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">
              <Lock size={16} /> 
              Password
            </label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isSignUp && (
              <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
                <Link to="/forgot-password" style={{ color: '#60a5fa', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 700 }}>
                  Forgot Tactical Credentials?
                </Link>
              </div>
            )}
          </div>

          <button type="submit" className="submit-button" disabled={loading} style={{ 
            marginTop: '2.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            height: '3.5rem',
            fontSize: '1.1rem',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? (
              isSignUp ? 'Creating Account...' : 'Signing in...'
            ) : (
              <>
                <LogIn size={20} />
                {isSignUp ? 'Sign Up' : 'Sign In to Dashboard'}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          </span>
          <button 
            type="button"
            onClick={() => setSearchParams(isSignUp ? {} : { mode: 'signup' })}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#3b82f6', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              fontSize: '0.95rem' 
            }}>
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ 
            color: '#94a3b8', 
            textDecoration: 'none', 
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
