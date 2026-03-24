'use client';
import { useState } from 'react';
import { getSupabase } from '../../lib/supabase';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else {
      onAuthenticated();
    }

    setLoading(false);
  }

  return (
    <div className="auth-gate">
      <p className="auth-gate__prompt">Sign in to continue.</p>
      <form className="auth-gate__form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="form-field__label">Email</label>
          <input
            className="form-field__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="form-field">
          <label className="form-field__label">Password</label>
          <input
            className="form-field__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && <p className="auth-gate__error">{error}</p>}
        <button
          className="auth-gate__submit"
          type="submit"
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
