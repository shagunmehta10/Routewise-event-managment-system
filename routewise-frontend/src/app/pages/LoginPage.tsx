import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { systemAPI } from '../../utils/api';
import { toast } from 'sonner';

import '../styles/dashboard.css';
import '../styles/create-event.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';
  
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
      <div style={{ zIndex: 10 }}>
        {isSignUp ? (
          <SignUp signInUrl="/login" forceRedirectUrl="/user-dashboard" />
        ) : (
          <SignIn signUpUrl="/login?mode=signup" forceRedirectUrl="/user-dashboard" />
        )}
      </div>
    </div>
  );
}
