import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { useUser } from '@clerk/clerk-react';
import { authAPI } from '../utils/api';
import { router } from './routes';

function SyncUserWrapper() {
  const { isSignedIn, user, isLoaded } = useUser();

  useEffect(() => {
    // Only attempt sync once we've loaded the user state and they are signed in.
    if (isLoaded && isSignedIn && user) {
      // Also check if we've already synced this user during this session to avoid spamming the endpoint.
      const currentStoredUser = localStorage.getItem('user');
      let shouldSync = true;
      if (currentStoredUser) {
        try {
          const parsed = JSON.parse(currentStoredUser);
          if (parsed && parsed.email === user.primaryEmailAddress?.emailAddress) {
            shouldSync = false;
          }
        } catch (e) {}
      }
      
      if (shouldSync) {
        authAPI.syncUser(user).then(() => {
          console.log('User synced with backend');
        });
      }
    } else if (isLoaded && !isSignedIn) {
      // If they signed out, clear local storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
  }, [isLoaded, isSignedIn, user]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return <SyncUserWrapper />;
}
