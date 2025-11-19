import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './AppWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';
import './index.css';
import './i18n';

// Set up window globals for Firebase
window.__appId = 'subscription-manager';
window.__initial_auth_token = null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <AppWrapper />
      </UserProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully');
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error);
      });
  });
}
