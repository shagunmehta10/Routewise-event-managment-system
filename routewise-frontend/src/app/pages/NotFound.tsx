import { Link } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';
import '../styles/not-found.css';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <AlertCircle size={64} className="not-found-icon" />
        <h1 className="not-found-title">404</h1>
        <p className="not-found-text">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="home-link">
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
