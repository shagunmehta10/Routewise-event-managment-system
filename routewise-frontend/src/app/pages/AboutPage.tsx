import { Navbar } from '../components/Navbar';
import { Shield, Zap, Globe, Target, Cpu, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="live-bg-container" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url("/landing_bg.png")' }}></div>
      <Navbar />
      
      <main style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 1.5rem', color: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Mission <span style={{ color: '#60a5fa' }}>Intelligence</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
            RouteWise is the world's most advanced tactical event management system, designed to eliminate logistical friction and ensure zero-clash mission deployments in complex urban environments.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {[
            { icon: <Target size={32} color="#60a5fa" />, title: 'Precision Routing', text: 'Our OSRM-powered tactical engine calculates multiple mission paths, prioritizing clear sectors and emergency response integrity.' },
            { icon: <Shield size={32} color="#60a5fa" />, title: 'Conflict Neutralization', text: 'Real-time clash detection prevents overlapping deployments, ensuring that high-priority missions always have the right of way.' },
            { icon: <Zap size={32} color="#60a5fa" />, title: 'Instant Deployment', text: 'Deploy complex mission parameters in seconds. From VIP convoys to medical emergencies, our system handles the logistics.' },
            { icon: <Globe size={32} color="#60a5fa" />, title: 'Global Oversight', text: 'Monitor your entire fleet across the globe with our unified monitoring dashboard and interactive situational maps.' },
            { icon: <Cpu size={32} color="#60a5fa" />, title: 'Neural Logistics', text: 'Leveraging state-of-the-art algorithms to predict traffic surges and suggest safe diversionary paths before problems arise.' },
            { icon: <Users size={32} color="#60a5fa" />, title: 'Commander Merit', text: 'A dedicated rewards system that incentivizes efficient mission management and tactical excellence.' },
          ].map((feature, i) => (
            <div key={i} className="cool-glass-card" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{feature.text}</p>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(20px)', padding: '4rem', borderRadius: '2.5rem', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>The RouteWise Vision</h2>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            Born out of the need for coordinated urban movement in Dehradun, India, RouteWise has evolved into a global standard for tactical logistics. Our vision is to create a world where movement is seamless, predictable, and prioritized based on human and operational needs.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#60a5fa' }}>99.9%</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Uptime</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#60a5fa' }}>50k+</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Missions</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#60a5fa' }}>0</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Conflicts</div>
            </div>
          </div>
        </div>
      </main>
      
      <footer style={{ textAlign: 'center', padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '0.9rem' }}>
        © 2026 RouteWise Tactical Operations Center. All Rights Reserved.
      </footer>
    </div>
  );
}
