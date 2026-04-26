import { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, ExternalLink, Navigation, Clock, Siren, ShieldCheck, Flag, Users, Heart } from 'lucide-react';
import { Link } from 'react-router';
import { useGeolocation } from '../../hooks/useGeolocation';
import { eventAPI } from '../../utils/api';
import '../styles/event-card.css';

interface EventCardProps {
  id?: string | number;
  name: string;
  description: string;
  date: string;
  startLocation: string;
  endLocation: string;
  startTime?: string;
  endTime?: string;
  status: string;
  imageUrl?: string;
  clashing?: boolean;
  eventType?: string;
}


export function EventCard({
  id,
  name,
  description,
  date,
  startLocation,
  endLocation,
  startTime,
  endTime,
  status: initialStatus,
  clashing,
  eventType
}: EventCardProps) {
  const { latitude, longitude } = useGeolocation();
  const [distInfo, setDistInfo] = useState<{ distance: string; time: string } | null>(null);

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'ambulance':
        return <Siren size={48} color="#ef4444" />;
      case 'vip':
        return <ShieldCheck size={48} color="#6366f1" />;
      case 'rally':
        return <Flag size={48} color="#f59e0b" />;
      case 'baraat':
        return <Heart size={48} color="#db2777" />;
      case 'funeral':
        return <Users size={48} color="#94a3b8" />;
      default:
        return <Navigation size={48} color="#3b82f6" />;
    }
  };

  // Dynamic status for display
  const status = eventAPI.getLiveStatus({ date, startTime, endTime, status: initialStatus });

  // Simple mock coordinates for events since they come as strings
  // In a real app, these would come from the backend or a geocoding service
  const eventCoords: Record<string, [number, number]> = {
    'City Hall, New York, NY, USA': [40.7128, -74.0060],
    'Javits Center, New York, NY, USA': [40.7578, -74.0026],
    'Coney Island Beach, Brooklyn, NY, USA': [40.5755, -73.9707],
  };

  useEffect(() => {
    if (latitude && longitude && eventCoords[startLocation]) {
      const start = eventCoords[startLocation];
      // Haversine distance formula (simplified)
      const R = 6371; // km
      const dLat = (start[0] - latitude) * Math.PI / 180;
      const dLon = (start[1] - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(start[0] * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      const time = Math.round(distance * 2); // Assume 2 mins per km for demo

      setDistInfo({
        distance: distance.toFixed(1) + ' km',
        time: time + ' min'
      });
    }
  }, [latitude, longitude, startLocation]);

  return (
    <div className="event-card">
      <div className="event-image-container elegant-logo">
        <div 
          className="event-image"
          style={{ 
            background: 'linear-gradient(135deg, #1e293b, #334155)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Elegant Logo Design */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(30px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', filter: 'blur(40px)' }}></div>
          
          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}>
            {getEventIcon(eventType)}
          </div>
        </div>
        <span className={`event-badge badge-${status.toLowerCase()}`}>
          {status === 'live' && <span className="status-pulse"></span>}
          {status}
        </span>
      </div>

      <div className="event-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="event-title">{name}</h3>
          {clashing && (
            <span style={{ 
              background: '#fee2e2', 
              color: '#ef4444', 
              fontSize: '0.65rem', 
              fontWeight: '900', 
              padding: '2px 6px', 
              borderRadius: '4px',
              border: '1px solid #fca5a5',
              animation: 'pulse 2s infinite'
            }}>
              CONFLICT
            </span>
          )}
        </div>
        <p className="event-description">{description}</p>

        <div className="event-details">
          <div className="detail-item">
            <Calendar size={16} className="detail-icon" />
            <span>{new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>

          <div className="detail-item">
            <MapPin size={16} className="detail-icon" />
            <span className="location-text">
              {startLocation}
              <ArrowRight size={14} className="arrow-icon" />
              {endLocation}
            </span>
          </div>

          {startTime && (
            <div className="detail-item" style={{ color: '#6366f1', fontWeight: '600' }}>
              <Clock size={16} className="detail-icon" />
              <span>{startTime} — {endTime || 'TBD'}</span>
            </div>
          )}

          {distInfo && (
            <div className="detail-item live-info-badge">
              <Navigation size={14} className="detail-icon" />
              <span className="live-text">
                {distInfo.distance} away | {distInfo.time} approx.
              </span>
            </div>
          )}
        </div>

        <Link to={`/events/${id}`} className="view-details-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ExternalLink size={16} />
          View Details
        </Link>
      </div>
    </div>
  );
}
