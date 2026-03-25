'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../lib/supabase';
import CompanionCard from '../molecules/CompanionCard';
import '@/styles/dashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Persona = {
  id: string;
  name: string;
  created_at: string;
  latest_score: number | null;
  monitor_status: string | null;
  last_check_at: string | null;
  model_name: string | null;
};

export function Dashboard() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPersonas() {
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setError('No active session');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/personas`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(body.error || 'Failed to load personas');
        }

        const data = await res.json();
        setPersonas(data);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPersonas();
  }, []);

  return (
    <div className="dashboard">
      <section className="dashboard__companions">
        <h2 className="sub-label">Identities</h2>

        {loading && (
          <p className="dashboard__loading-message">Loading...</p>
        )}

        {!loading && (error !== null || personas.length === 0) && (
          <>
            <div className="empty-state">
              <p className="empty-state-title">No identities preserved yet</p>
              <p className="empty-state-msg">Start by pasting a conversation</p>
            </div>
            <Link href="/create/manual" className="btn btn-brand">
              Preserve your first AI identity
            </Link>
          </>
        )}

        {!loading && error === null && personas.length > 0 && (
          <>
            <div className="dashboard__companions-grid">
              {personas.map((p) => (
                <CompanionCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  created_at={p.created_at}
                  latest_score={p.latest_score}
                  monitor_status={p.monitor_status}
                  last_check_at={p.last_check_at}
                  model_name={p.model_name}
                />
              ))}
            </div>
            <Link href="/create/manual" className="btn btn-brand">
              Preserve a new identity
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
