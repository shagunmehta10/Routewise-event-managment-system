import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { eventAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Calendar, MapPin, FileText, Type, Clock, Save, X } from 'lucide-react';
import '../styles/create-event.css';

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    startLocation: '',
    endLocation: '',
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await eventAPI.getEventById(id);
        if (data) {
          // Format date for input[type="date"]
          const formattedDate = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
          setFormData({
            name: data.name || '',
            description: data.description || '',
            date: formattedDate,
            startTime: data.startTime || '',
            endTime: data.endTime || '',
            startLocation: data.startLocation || '',
            endLocation: data.endLocation || '',
          });
        }
      } catch (error) {
        console.error('Error fetching event for edit:', error);
        toast.error('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSubmitting(true);
    try {
      await eventAPI.updateEvent(id, formData);
      toast.success('Event updated successfully!');
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: '#3b82f6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
      <Navbar />
      <main style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <div className="page-header" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>Modify Operation</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1.1rem' }}>Update tactical details for your scheduled event.</p>
        </div>

        <div className="create-event-card" style={{ background: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 20px 25px -5px rgba(30, 64, 175, 0.05)' }}>
          <form className="event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#1e40af' }}>
                <Type size={16} /> Operation Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter event name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#7c3aed' }}>
                <FileText size={16} /> Mission Objectives
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Event description"
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#db2777' }}>
                <Calendar size={16} /> Deployment Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#2563eb' }}>
                  <Clock size={16} /> COMMENCE
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#2563eb' }}>
                  <Clock size={16} /> CONCLUDE
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#059669' }}>
                <MapPin size={16} /> Origin Location
              </label>
              <input
                type="text"
                name="startLocation"
                value={formData.startLocation}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#dc2626' }}>
                <MapPin size={16} /> Destination Point
              </label>
              <input
                type="text"
                name="endLocation"
                value={formData.endLocation}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
              <button 
                type="submit" 
                disabled={submitting}
                className="submit-button"
                style={{ flex: 2, height: '3.5rem' }}
              >
                {submitting ? 'Syncing...' : (
                  <>
                    <Save size={20} /> Update Mission
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={() => navigate(`/events/${id}`)}
                className="form-input"
                style={{ 
                  flex: 1, 
                  height: '3.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: 'bold',
                  background: '#f1f5f9',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <X size={20} /> ABORT
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
