'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../../lib/supabase';
import { AuthGate } from '../../../components/molecules/AuthGate';
import { CreateSnapshotForm } from '../../../components/organisms/CreateSnapshotForm';

export default function NewSnapshotPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        setIsAuthenticated(!!data.session);
        setAuthChecked(true);
      });
  }, []);

  function handleCreated(snapshotId: string) {
    router.push(`/snapshots/${snapshotId}`);
  }

  // Avoid flash of unauthenticated content
  if (!authChecked) return null;

  return (
    <div className="new-snapshot-page">
      <h1 className="new-snapshot-page__title">New snapshot</h1>
      {isAuthenticated ? (
        <CreateSnapshotForm onCreated={handleCreated} />
      ) : (
        <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
}
