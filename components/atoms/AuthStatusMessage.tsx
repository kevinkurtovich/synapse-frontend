'use client';

interface AuthStatusMessageProps {
  type: 'loading' | 'success' | 'error';
  message?: string;
}

export function AuthStatusMessage({ type, message }: AuthStatusMessageProps) {
  const className = `auth-status auth-status--${type}`;

  if (type === 'loading') {
    return <p className={className}>Loading...</p>;
  }

  return <p className={className}>{message}</p>;
}
