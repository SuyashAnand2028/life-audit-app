import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';

// Sub-component to manage authentication check and render correct view
const AppContent: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          gap: '1rem',
        }}
      >
        <div
          className="pulse"
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
          }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Verifying session credentials...
        </span>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
