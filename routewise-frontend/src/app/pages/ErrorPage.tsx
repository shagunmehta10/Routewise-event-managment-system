import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import '../styles/error-page.css';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage: string;
  let errorStatus: number | string = "Error";

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || "An unexpected route error occurred.";
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = "Unknown error occurred.";
  }

  return (
    <div className="error-page-container">
      <div className="error-card">
        <div className="error-icon-wrapper">
          <AlertTriangle size={40} />
        </div>
        <h1 className="error-title">System Malfunction</h1>
        <p className="error-message">
          We've encountered an unexpected error while processing your request. 
          Our tactical team has been notified.
        </p>
        
        <div className="error-details">
          <strong>{errorStatus}:</strong> {errorMessage}
        </div>

        <div className="error-actions">
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} />
              Return Base
            </div>
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-secondary"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCcw size={18} />
              Retry Operation
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
