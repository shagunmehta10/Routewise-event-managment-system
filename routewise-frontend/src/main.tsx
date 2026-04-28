import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import './styles/fonts.css';
import './styles/theme.css';
import './styles/tailwind.css';
import './app/styles/premium-theme.css';
import { ClerkProvider } from '@clerk/clerk-react';

import { Toaster } from 'sonner';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
      <Toaster position="top-center" richColors />
    </ClerkProvider>
  </React.StrictMode>
);
