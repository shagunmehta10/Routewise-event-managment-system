import { useState, useEffect } from 'react';
import { History, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router';
import * as Popover from '@radix-ui/react-popover';
import { authAPI, eventAPI } from '../../utils/api';
import { useUser } from '@clerk/clerk-react';

export function HistoryPopover() {
  const { user: clerkUser } = useUser();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!clerkUser) return;
    const fetchHistory = async () => {
      try {
        const userData = await authAPI.getProfile();
        const events = await eventAPI.getAllEvents(userData.id);
        setHistory(events);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [clerkUser]);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', 
          background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa',
          padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid rgba(59, 130, 246, 0.2)',
          cursor: 'pointer', fontWeight: 'bold'
        }}>
          <History size={18} />
          <span style={{ fontSize: '0.9rem' }}>History & Events</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={5} align="end" style={{ 
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
          padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '350px', maxHeight: '400px', overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100, color: 'white'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <History size={20} color="#60a5fa" /> Mission Logs
          </h3>
          {history.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No history found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map(ev => (
                <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ 
                    padding: '0.75rem', background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#fff', fontSize: '0.95rem' }}>{ev.name}</h4>
                    <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} color="#60a5fa" /> {ev.startLocation} ➔ {ev.endLocation}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} color="#60a5fa" /> {ev.startTime}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
