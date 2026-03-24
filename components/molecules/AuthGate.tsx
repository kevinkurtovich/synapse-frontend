'use client';
import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabase } from '../../lib/supabase';
import { AuthStatusMessage } from '../atoms/AuthStatusMessage';

interface AuthGateProps {
  children: ReactNode;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Invalid email or password.';
  if (m.includes('email not confirmed')) return 'Check your email to confirm your account.';
  if (m.includes('token has expired') || m.includes('otp_expired')) return 'This link has expired. Please request a new one.';
  if (m.includes('already registered') || m.includes('user already registered')) return 'This email is already registered. Try signing in instead.';
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to fetch')) return 'Network error. Please check your connection and try again.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.';
  return message;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const [sessionState, setSessionState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      setSessionState(data.session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionState('authenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (sessionState === 'loading') {
    return <AuthStatusMessage type="loading" />;
  }

  if (sessionState === 'authenticated') {
    return <>{children}</>;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setStatus(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}`;

    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus({ type: 'error', message: mapAuthError(error.message) });
    } else {
      setStatus({ type: 'success', message: 'Check your email for your login link.' });
    }
    setLoading(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setStatus(null);

    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus({ type: 'error', message: mapAuthError(error.message) });
    }
    setLoading(false);
  }

  async function handleSignUp() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setStatus(null);

    const { data, error } = await getSupabase().auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus({ type: 'error', message: mapAuthError(error.message) });
    } else if (!data.session) {
      setStatus({ type: 'success', message: 'Check your email to confirm your account.' });
    }
    setLoading(false);
  }

  return (
    <div className="auth-gate">
      <p className="auth-gate__prompt">Sign in to continue.</p>

      {!showPassword ? (
        <form className="auth-gate__form" onSubmit={handleMagicLink}>
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
          {status && <AuthStatusMessage type={status.type} message={status.message} />}
          <button
            className="auth-gate__submit"
            type="submit"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Sending...' : 'Continue'}
          </button>
        </form>
      ) : (
        <form className="auth-gate__form" onSubmit={handleSignIn}>
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
          {status && <AuthStatusMessage type={status.type} message={status.message} />}
          <div className="auth-gate__actions">
            <button
              className="auth-gate__submit"
              type="submit"
              disabled={loading || !email.trim() || !password}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              className="auth-gate__secondary"
              type="button"
              disabled={loading || !email.trim() || !password}
              onClick={handleSignUp}
            >
              Sign up
            </button>
          </div>
        </form>
      )}

      <button
        className="auth-gate__toggle"
        type="button"
        onClick={() => { setShowPassword(!showPassword); setStatus(null); }}
      >
        {showPassword ? 'Use magic link instead' : 'Use password instead'}
      </button>
    </div>
  );
}
