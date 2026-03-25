'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@/styles/identity-check.css';

import IdentityCheckResult from '@/components/organisms/IdentityCheckResult';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type ProbeResult = {
  label: string;
  prompt: string;
  response: string;
  passed: boolean;
};

type ValidationRun = {
  id: string;
  verdict: 'PASS' | 'FAIL';
  passed_count: number;
  total_count: number;
  restoration_profile_id: string;
  created_at: string;
};

export default function CheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: snapshotId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profile_id');

  const [run, setRun] = useState<ValidationRun | null>(null);
  const [probeResults, setProbeResults] = useState<ProbeResult[]>([]);
  const [state, setState] = useState<'running' | 'complete'>('running');
  const [runningProbeIndex, setRunningProbeIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!profileId) {
      router.push(`/snapshots/${snapshotId}`);
      return;
    }

    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function triggerValidation() {
      try {
        const res = await fetch(`${API_URL}/validations/${profileId}/validate`, {
          method: 'POST',
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 404) {
            setError('Restoration profile not found.');
          } else if (res.status === 502) {
            setError(
              'Validation could not complete. The language model returned an error.'
            );
          } else {
            setError(body.error || 'An unexpected error occurred.');
          }
          return;
        }

        const data = await res.json();
        const validationRun: ValidationRun = data.validation_run;
        const probes: ProbeResult[] = data.probe_results || [];

        setRun(validationRun);
        setProbeResults(probes);

        // Staggered reveal: 300ms per row
        for (let i = 0; i <= probes.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, i === 0 ? 0 : 300));
          setRunningProbeIndex(i);
        }

        setState('complete');
      } catch {
        setError('An unexpected error occurred.');
      }
    }

    triggerValidation();
  }, [profileId, snapshotId]);

  if (error) {
    return (
      <div className="identity-check-page">
        <div className="identity-check-page__error">{error}</div>
        <a href={`/snapshots/${snapshotId}`} className="identity-check-page__error-link">
          &larr; Back to snapshot
        </a>
      </div>
    );
  }

  const displayRun = run || {
    id: '',
    verdict: 'FAIL' as const,
    passed_count: 0,
    total_count: 3,
    restoration_profile_id: profileId || '',
    created_at: '',
  };

  return (
    <div className="identity-check-page">
      <IdentityCheckResult
        run={displayRun}
        probeResults={probeResults}
        snapshotId={snapshotId}
        state={state}
        runningProbeIndex={runningProbeIndex}
      />
    </div>
  );
}
