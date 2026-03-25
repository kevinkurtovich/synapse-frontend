'use client';

import '@/styles/ingest.css';
import '@/styles/atoms.css';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Turn = { speaker: string; text: string };
type IngestState = 'idle' | 'parsing' | 'previewing' | 'submitting';

export default function IngestPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<IngestState>('idle');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview state (FEAT-0015)
  const [parsedTurns, setParsedTurns] = useState<Turn[]>([]);
  const [parseConfidence, setParseConfidence] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !transcript.trim()) return;

    setError(null);
    setStatus(null);
    setState('parsing');

    try {
      // Step 1: Parse transcript via backend
      const parseRes = await fetch(`${API_URL}/parse-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });

      if (!parseRes.ok) {
        const body = await parseRes.json().catch(() => ({ error: 'Failed to parse transcript' }));
        setError(
          body.error ||
            "We couldn't detect conversation turns in this text. Make sure it contains at least two messages from different speakers."
        );
        setState('idle');
        return;
      }

      const parseResult = await parseRes.json();
      const { turns, confidence } = parseResult;

      if (!turns || turns.length < 2) {
        setError(
          "We couldn't detect conversation turns in this text. Make sure it contains at least two messages from different speakers."
        );
        setState('idle');
        return;
      }

      // High confidence → skip preview, proceed directly (INV-01: user confirmation not needed)
      if (confidence === 'high') {
        await distill(turns);
        return;
      }

      // Medium or low confidence → show preview for user confirmation
      setParsedTurns(turns);
      setParseConfidence(confidence);
      setState('previewing');
    } catch (err: any) {
      setError(err.message || 'An error occurred during parsing');
      setState('idle');
    }
  }

  async function handleConfirmPreview() {
    await distill(parsedTurns);
  }

  function handleEditTranscript() {
    setState('idle');
    setParsedTurns([]);
    setParseConfidence(null);
    setError(null);
    setStatus(null);
    // transcript is preserved in state — user can edit and retry
  }

  async function distill(turns: Turn[]) {
    setState('submitting');
    setError(null);
    setStatus('Creating persona...');

    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError('Session expired');
        setState('idle');
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

      // Step 2: Distill — send pre-parsed turns to skip re-parsing
      setStatus('Reconstructing identity... This may take a moment.');

      const distillRes = await fetch(`${API_URL}/personas/${persona.id}/distill`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ turns }),
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
      setState('idle');
    }
  }

  const isLoading = state === 'parsing' || state === 'submitting';

  // --- Previewing state: show parsed conversation preview ---
  if (state === 'previewing') {
    return (
      <div className="ingest-page">
        <div className="sec-hd">
          <div className="sec-title">Parsed Conversation Preview</div>
          <div className="sec-desc">
            Review the detected turns before preserving this identity.
          </div>
        </div>

        <div className="card">
          <div className="card-hd">
            <span className="card-title">{name}</span>
            <span className={`badge ${parseConfidence === 'low' ? 'badge-warn' : 'badge-info'}`}>
              {parsedTurns.length} turns detected
            </span>
          </div>

          <p className="ingest-preview__note">
            We detected {parsedTurns.length} conversation turns automatically.
            Please confirm this looks right before preserving.
          </p>

          {parseConfidence === 'low' && (
            <p className="ingest-preview__note">
              <span className="badge badge-warn">low confidence</span>{' '}
              We&rsquo;re less certain about the turn structure — check the preview carefully.
            </p>
          )}

          <div className="ingest-preview__turns">
            {parsedTurns.map((turn, i) => (
              <div key={i} className="ingest-preview__turn">
                <span className="ingest-preview__speaker">{turn.speaker}</span>
                <span className="ingest-preview__text">{turn.text}</span>
              </div>
            ))}
          </div>

          <div className="ingest-preview__actions">
            <button className="btn btn-brand" type="button" onClick={handleConfirmPreview}>
              Looks right — preserve identity
            </button>
            <button className="btn btn-default" type="button" onClick={handleEditTranscript}>
              Edit transcript
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Idle / Parsing / Submitting states ---
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
          disabled={isLoading || !name.trim() || !transcript.trim()}
        >
          {isLoading ? 'Processing...' : 'Preserve Identity'}
        </button>
      </form>
    </div>
  );
}
