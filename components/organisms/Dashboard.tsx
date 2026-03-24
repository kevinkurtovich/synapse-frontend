'use client';
import Link from 'next/link';
import '@/styles/dashboard.css';

export function Dashboard() {
  return (
    <div className="dashboard">
      <section className="dashboard__companions">
        <h2 className="dashboard__companions-title">Companions</h2>
        <p className="dashboard__empty-message">
          No companions yet. Create one to get started.
        </p>
        <Link href="/create/manual" className="dashboard__cta">
          Upload your first personality
        </Link>
      </section>
    </div>
  );
}
