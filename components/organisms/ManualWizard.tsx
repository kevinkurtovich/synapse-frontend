'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormField } from '../atoms/FormField';
import { getSupabase } from '../../lib/supabase';
import '@/styles/wizards.css';
import '@/styles/atoms.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ManualWizardProps {
  onCreated?: (snapshotId: string) => void;
}

export function ManualWizard({ onCreated }: ManualWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companionName, setCompanionName] = useState('');
  const [memoryContext, setMemoryContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TOTAL_STEPS = 3;

  async function handleSubmit() {
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
      const snapshotId = result.snapshot.id;

      if (onCreated) {
        onCreated(snapshotId);
      } else {
        router.push(`/snapshots/${snapshotId}`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const truncatedContext = memoryContext.length > 200
    ? memoryContext.slice(0, 200) + '...'
    : memoryContext;

  return (
    <div className="wizard">
      <div className="wizard__indicator">Step {step} of {TOTAL_STEPS}</div>

      {step === 1 && (
        <div className="wizard__step">
          <h2 className="wizard__step-title">Name your companion</h2>
          <FormField
            label="Companion name"
            value={companionName}
            onChange={setCompanionName}
            required
            placeholder="e.g. Aria"
          />
          <div className="wizard__nav">
            <button
              className="wizard__nav-primary"
              type="button"
              disabled={!companionName.trim()}
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard__step">
          <h2 className="wizard__step-title">Describe the memory context</h2>
          <p className="wizard__step-description">
            What should this companion remember? Behavioral context, history, relationships.
          </p>
          <FormField
            label="Memory context"
            type="textarea"
            value={memoryContext}
            onChange={setMemoryContext}
            required
            placeholder="Describe what this companion should remember."
            rows={6}
          />
          <div className="wizard__nav">
            <button
              className="wizard__nav-back"
              type="button"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="wizard__nav-primary"
              type="button"
              disabled={!memoryContext.trim()}
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard__step">
          <h2 className="wizard__step-title">Create companion</h2>
          <div className="wizard__summary-card">
            <div className="wizard__summary-field">
              <p className="wizard__summary-label">Companion name</p>
              <p className="wizard__summary-value">{companionName}</p>
            </div>
            <div className="wizard__summary-field">
              <p className="wizard__summary-label">Memory context</p>
              <p className="wizard__summary-value">{truncatedContext}</p>
            </div>
          </div>
          {error && <p className="wizard__error">{error}</p>}
          <div className="wizard__nav">
            <button
              className="wizard__nav-back"
              type="button"
              disabled={loading}
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              className="wizard__nav-primary"
              type="button"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Creating...' : 'Create companion'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
