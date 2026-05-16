'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      router.push('/notes');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Continue your journey with Peblo AI</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link href="/signup" className="auth-link">Create one</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .error-message {
          padding: 0.8rem;
          background: hsla(0, 100%, 65%, 0.1);
          color: hsl(0, 100%, 65%);
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid hsla(0, 100%, 65%, 0.2);
        }

        .auth-btn {
          width: 100%;
          justify-content: center;
          margin-top: 1rem;
          padding: 0.9rem;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .auth-link {
          color: var(--text-main);
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
