'use client';
import { useState } from 'react';
import { FormField } from '../atoms/FormField';
import { getSupabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface CreateSnapshotFormProps {
  onCreated: (snapshotId: string) => void;
}

export function CreateSnapshotForm({ onCreated }: CreateSnapshotFormProps) {
  const [companionName, setCompanionName] = useState('');
  const [memoryContext, setMemoryContext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companionName.trim() || !memoryContext.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('Session expired. Refresh the page to sign in again.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          companion_name: companionName.trim(),
          memory_context: memoryContext.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error || 'Failed to create snapshot');
      }

      const result = await res.json();
      onCreated(result.snapshot.id);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = companionName.trim().length > 0 && memoryContext.trim().length > 0;

  return (
    <form className="create-snapshot-form" onSubmit={handleSubmit}>
      <FormField
        label="Companion name"
        value={companionName}
        onChange={setCompanionName}
        required
        placeholder="e.g. Aria"
      />
      <FormField
        label="Memory context"
        type="textarea"
        value={memoryContext}
        onChange={setMemoryContext}
        required
        placeholder="Describe what this companion should remember — behavioral context, history, relationships."
        rows={6}
      />
      {error && <p className="create-snapshot-form__error">{error}</p>}
      <button
        className="create-snapshot-form__submit"
        type="submit"
        disabled={loading || !canSubmit}
      >
        {loading ? 'Creating...' : 'Create snapshot'}
      </button>
    </form>
  );
}
