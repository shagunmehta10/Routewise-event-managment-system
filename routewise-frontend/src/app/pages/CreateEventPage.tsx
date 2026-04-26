import { useNavigate } from 'react-router';
import { CreateEvent } from '../components/CreateEvent';
import { Navbar } from '../components/Navbar';
import { toast } from 'sonner';
import '../styles/dashboard.css';

export default function CreateEventPage() {
  const navigate = useNavigate();

  const handleEventCreated = (createdEvent: any) => {
    // Show success toast
    toast.success('🎉 Event Created Successfully!', {
      description: `"${createdEvent?.name || 'Your event'}" has been created. Redirecting to details...`,
      duration: 4000,
    });

    // Navigate to the event details page after a short delay
    const eventId = createdEvent?.id || createdEvent?.data?.id;
    if (eventId) {
      setTimeout(() => navigate(`/events/${eventId}`), 1000);
    } else {
      // fallback: go to events list
      setTimeout(() => navigate('/events'), 1000);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <main className="dashboard-main" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
        <div className="page-header" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-1px' }}>Mission Deployment</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.75rem', fontSize: '1.1rem' }}>Initiate tactical routing and schedule clearance for fleet units.</p>
        </div>
        <CreateEvent onEventCreated={handleEventCreated} />
      </main>
    </div>
  );
}
