import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { wakeUpBackend } from './services/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Pre-warm the Render backend the moment JS loads.
// This fires silently in the background while the user reads the login page.
wakeUpBackend();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('React crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#f87171', marginBottom: '1rem' }}>⚠ App Crashed</h1>
          <pre style={{
            background: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            maxWidth: '800px',
            width: '100%',
            overflow: 'auto',
            color: '#fca5a5',
            fontSize: '0.8rem',
            lineHeight: 1.6
          }}>
            {String(this.state.error)}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 2rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'dummy_client_id_so_hook_doesnt_crash'}>
      <App />
    </GoogleOAuthProvider>

  </ErrorBoundary>
)
