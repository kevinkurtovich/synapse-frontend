'use client';

import '@/styles/ingest.css';
import '@/styles/atoms.css';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function IngestPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !transcript.trim()) return;

    setLoading(true);
    setError(null);
    setStatus('Creating persona...');

    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Session expired');
        setLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Step 1: Create persona
      const personaRes = await fetch(`${API_URL}/personas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!personaRes.ok) {
        const body = await personaRes.json().catch(() => ({ error: 'Failed to create persona' }));
        throw new Error(body.error || 'Failed to create persona');
      }

      const persona = await personaRes.json();

      // Step 2: Distill
      setStatus('Reconstructing identity... This may take a moment.');

      const distillRes = await fetch(`${API_URL}/personas/${persona.id}/distill`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      if (!distillRes.ok) {
        const body = await distillRes.json().catch(() => ({ error: 'Distillation failed' }));
        throw new Error(body.error || 'Distillation failed');
      }

      // Step 3: Navigate to Persona Room
      setStatus('Identity reconstructed. Redirecting...');
      router.push(`/personas/${persona.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setStatus(null);
      setLoading(false);
    }
  }

  return (
    <div className="ingest-page">
      <div className="sec-hd">
        <div className="sec-title">Preserve an AI Identity</div>
        <div className="sec-desc">
          Paste a real conversation with the AI companion you want to preserve. Synapse will reconstruct its identity from the transcript.
        </div>
      </div>

      <form className="ingest-page__form" onSubmit={handleSubmit}>
        <div className="ingest-page__field">
          <label className="sub-label">Companion Name</label>
          <input
            className="form-field__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aria"
            required
          />
        </div>

        <div className="ingest-page__field">
          <label className="sub-label">Conversation Transcript</label>
          <textarea
            className="form-field__textarea"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste a real conversation with this AI identity..."
            rows={12}
            required
          />
        </div>

        {error && <p className="ingest-page__error">{error}</p>}
        {status && <p className="ingest-page__status">{status}</p>}

        <button
          className="btn btn-brand"
          type="submit"
          disabled={loading || !name.trim() || !transcript.trim()}
        >
          {loading ? 'Processing...' : 'Preserve Identity'}
        </button>
      </form>
    </div>
  );
}
