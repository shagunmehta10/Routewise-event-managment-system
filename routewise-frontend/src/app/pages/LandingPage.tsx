import { Link } from 'react-router';
import { MapPin, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import '../styles/dashboard.css';
import { TrafficTicker } from '../components/TrafficTicker';

export default function LandingPage() {
  return (
    <>
      <TrafficTicker />
      <div style={{ minHeight: 'calc(100vh - 36px)', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url("/landing_bg.png")' }}></div>
      <header style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <MapPin color="#3b82f6" size={28} />
          <span>RouteWise</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: '500', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.2)' }}>Log In</Link>
          <Link to="/login?mode=signup" style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', textDecoration: 'none', fontWeight: '500', transition: 'all 0.2s' }}>Sign Up</Link>
        </div>
      </header>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ padding: '1rem 2rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '2rem', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <Zap size={18} /> The Future of Event Routing
        </div>
        <h1 style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem', maxWidth: '800px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Navigate your events with precision.
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.6' }}>
          RouteWise helps you manage, track, and streamline vehicle routes for your events all in one place. Enhance safety, optimize distance, and deploy seamlessly.
        </p>
        
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/login?mode=signup" style={{ padding: '1rem 2.5rem', borderRadius: '0.75rem', background: '#3b82f6', color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
            Get Started <ArrowRight size={20} />
          </Link>
          <Link to="/login" style={{ padding: '1rem 2.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} /> Authority Login
          </Link>
        </div>
      </main>
      
      <footer style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        © 2026 RouteWise Intelligent Event Management. All rights reserved.
      </footer>
      </div>
    </>
  );
}
