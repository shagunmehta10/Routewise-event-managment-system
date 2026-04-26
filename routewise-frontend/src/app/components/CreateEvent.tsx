import React, { useState } from 'react';
import { Type, Loader2, ChevronRight, MapPin, Shuffle } from 'lucide-react';
import { eventAPI, venueAPI } from '../../utils/api';
import { toast } from 'sonner';
import '../styles/create-event.css';
import { detectClash, type ClashResult } from '../../utils/clashDetector';
import { ClashAlert } from './ClashAlert';

interface CreateEventProps {
  onEventCreated: (event: any) => void;
}

export function CreateEvent({ onEventCreated }: CreateEventProps) {
  const [formData, setFormData] = useState({
    name: '', description: '', date: '', startTime: '', endTime: '',
    startLocation: '', endLocation: '', eventType: 'other',
    venueId: '',
  });
  const [venues, setVenues] = useState<any[]>([]);
  const [clashResult, setClashResult] = useState<ClashResult | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  React.useEffect(() => {
    venueAPI.getAllVenues().then(setVenues).catch(console.error);
  }, []);

  const [coords, setCoords] = useState<{ start: [number, number] | null; end: [number, number] | null }>({
    start: null, end: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const setRandomLocation = (type: 'start' | 'end') => {
    const lat = 30.28 + (Math.random() * 0.08);
    const lon = 77.98 + (Math.random() * 0.10);
    const coord: [number, number] = [lat, lon];
    setCoords(p => ({ ...p, [type]: coord }));
    setFormData(p => ({ ...p, [type === 'start' ? 'startLocation' : 'endLocation']: `Tactical Point (${lat.toFixed(4)}, ${lon.toFixed(4)})` }));
    toast.info(`Random ${type.toUpperCase()} point established.`);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const doCreateEvent = async (penaltyPoints = 0) => {
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const result = await eventAPI.createEvent({
        ...formData,
        startCoords: coords.start,
        endCoords:   coords.end,
        status:      'upcoming',
        userId:      user?.id,
        penalty:     penaltyPoints,
        is_private:  user?.settings?.privacy === 'private',
      });
      toast.success(
        penaltyPoints > 0
          ? `⚠️ Event deployed with ${penaltyPoints} penalty points.`
          : '✅ Event Route Deployed!'
      );
      setFormData({ name:'', description:'', date:'', startTime:'', endTime:'', startLocation:'', endLocation:'', eventType:'other', venueId:'' });
      setCoords({ start:null, end:null });
      onEventCreated(result);
    } catch (error: any) {
      toast.error(error.message || 'Error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmWithPenalty = async () => {
    setClashResult(null);
    setPendingSubmit(false);
    setSubmitting(true);
    await doCreateEvent(clashResult?.penaltyPoints ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const existingEvents = await eventAPI.getAllEvents(user?.id);
      
      const clash = detectClash(
        { name: formData.name, date: formData.date, startTime: formData.startTime, endTime: formData.endTime },
        existingEvents
      );

      if (clash.clashes) {
        setClashResult(clash);
        setPendingSubmit(true);
        setSubmitting(false);
        return; // pause — show modal
      }

      await doCreateEvent();
    } catch (err) {
      toast.error('Could not verify schedule.');
      setSubmitting(false);
    }
  };

  return (
    <div className="create-event-card">
      <div className="mission-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#60a5fa', margin: 0 }}>Mission Dispatch</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>Define mission coordinates and operational window</p>
        </div>
      </div>

      <form className="event-form" onSubmit={handleSubmit} style={{ marginTop: '2.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom:'1.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#93c5fd' }}><MapPin size={16} /> Start Location</label>
            <input className="form-input" type="text" name="startLocation" value={formData.startLocation} onChange={handleChange} placeholder="Origin (e.g., Prem Nagar, Dehradun)" required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: '#93c5fd' }}><MapPin size={16} /> End Location</label>
            <input className="form-input" type="text" name="endLocation" value={formData.endLocation} onChange={handleChange} placeholder="Destination (e.g., Clock Tower, Dehradun)" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#93c5fd' }}><Type size={16} /> Mission Name</label>
            <input className="form-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Operation ID" required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: '#93c5fd' }}>Classification</label>
            <select className="form-select" name="eventType" value={formData.eventType} onChange={handleChange}>
               <option value="other">Standard Deployment</option>
               <option value="baraat">Wedding Procession (Baraat)</option>
               <option value="ambulance">Medical Emergency</option>
               <option value="rally">Political Convoy</option>
               <option value="vip">VIP Clearance</option>
            </select>
          </div>
        </div>

        {formData.eventType === 'baraat' && (
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Destination Venue (Approved Only)</label>
            <select 
              className="form-select" 
              name="venueId" 
              value={formData.venueId} 
              onChange={handleChange}
              required={formData.eventType === 'baraat'}
            >
              <option value="">Select a Venue</option>
              {venues.filter(v => v.approved).map(v => (
                <option key={v.id} value={v.id}>{v.name} - {v.address}</option>
              ))}
            </select>
            {venues.filter(v => v.approved).length === 0 && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>No approved venues available. Please register one first.</p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {['date', 'startTime', 'endTime'].map((f) => (
            <div key={f} className="form-group">
               <label className="form-label" style={{ color: '#93c5fd' }}>{f === 'startTime' ? 'Launch' : (f === 'endTime' ? 'Arrival' : 'Mission Date')}</label>
               <input className="form-input" type={f === 'date' ? 'date' : 'time'} name={f} value={formData[f as 'date'|'startTime'|'endTime']} onChange={handleChange} required />
            </div>
          ))}
        </div>

        <button type="submit" className="submit-button" disabled={submitting} style={{ width: '100%', marginTop: '1rem', height: '3.5rem' }}>
          {submitting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              Deploy Mission <ChevronRight size={20} />
            </>
          )}
        </button>
      </form>

      {clashResult && (
        <ClashAlert
          result={clashResult}
          onConfirm={handleConfirmWithPenalty}
          onCancel={() => { setClashResult(null); setPendingSubmit(false); }}
        />
      )}
    </div>
  );
}
