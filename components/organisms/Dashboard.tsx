'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../../lib/supabase';
import CompanionCard from '../molecules/CompanionCard';
import '@/styles/dashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Snapshot = {
  id: string;
  name: string;
  created_at: string;
};

export function Dashboard() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSnapshots() {
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          setError('No active session');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/snapshots`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(body.error || 'Failed to load companions');
        }

        const data = await res.json();
        setSnapshots(data);
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSnapshots();
  }, []);

  return (
    <div className="dashboard">
      <section className="dashboard__companions">
        <h2 className="dashboard__companions-title">Companions</h2>

        {loading && (
          <p className="dashboard__loading-message">Loading...</p>
        )}

        {!loading && (error !== null || snapshots.length === 0) && (
          <>
            <p className="dashboard__empty-message">
              No companions yet. Create one to get started.
            </p>
            <Link href="/create/manual" className="dashboard__cta">
              Upload your first personality
            </Link>
          </>
        )}

        {!loading && error === null && snapshots.length > 0 && (
          <>
            <div className="dashboard__companions-grid">
              {snapshots.map((s) => (
                <CompanionCard
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  created_at={s.created_at}
                />
              ))}
            </div>
            <Link href="/create/manual" className="dashboard__cta">
              Upload your first personality
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
