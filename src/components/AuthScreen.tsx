import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let result;
      if (isLoginMode) {
        result = await login(email.trim(), password);
      } else {
        result = await register(email.trim(), password);
      }

      if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.15) 0%, rgba(10, 11, 16, 1) 90%)',
        padding: '1.5rem',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-purple)', fontSize: '2rem' }}>⚡</span> Life Audit OS
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isLoginMode
              ? 'Sign in to access your resource and balance telemetry'
              : 'Create a private account to start tracking time, money, and focus'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              color: 'var(--accent-rose)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '6px',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLoginMode ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-purple)',
              fontWeight: 'bold',
              marginLeft: '0.25rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            disabled={loading}
          >
            {isLoginMode ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AuthScreen;
