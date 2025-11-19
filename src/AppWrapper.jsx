import React from 'react';
import { useUser } from './context/UserContext';
import AuthPage from './pages/AuthPage';
import App from './App';

export default function AppWrapper() {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(156, 163, 175, 0.2)', borderTop: '4px solid #d6ff59', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#9ca3af', fontWeight: '500' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <App /> : <AuthPage />;
}
