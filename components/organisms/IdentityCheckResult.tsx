import '@/styles/atoms.css';
import '@/styles/molecules.css';
import '@/styles/organisms.css';

import VerdictSignal from '@/components/molecules/VerdictSignal';
import ProbeResultRow from '@/components/molecules/ProbeResultRow';

type IdentityCheckResultProps = {
  run: {
    id: string;
    verdict: 'PASS' | 'FAIL';
    passed_count: number;
    total_count: number;
    restoration_profile_id: string;
    created_at: string;
  };
  probeResults: Array<{
    label: string;
    prompt: string;
    response: string;
    passed: boolean;
  }>;
  snapshotId: string;
  state: 'running' | 'complete';
  runningProbeIndex: number;
};

const PROBE_ORDER = ['companion_name', 'user_recognition', 'relationship_framing'];

const PLACEHOLDER_PROBES = PROBE_ORDER.map((label) => ({
  label,
  prompt: '',
  response: '',
  passed: false,
}));

export default function IdentityCheckResult({
  run,
  probeResults,
  snapshotId,
  state,
  runningProbeIndex,
}: IdentityCheckResultProps) {
  const probes = state === 'running' && probeResults.length === 0
    ? PLACEHOLDER_PROBES
    : probeResults;

  const sortedProbes = [...probes].sort((a, b) => {
    const ai = PROBE_ORDER.indexOf(a.label);
    const bi = PROBE_ORDER.indexOf(b.label);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  function getProbeState(index: number): 'pending' | 'running' | 'complete' {
    if (state === 'complete') return 'complete';
    if (index < runningProbeIndex) return 'complete';
    if (index === runningProbeIndex) return 'running';
    return 'pending';
  }

  return (
    <div className="identity-check-result">
      <a href={`/snapshots/${snapshotId}`} className="identity-check-result__back">
        &larr; Snapshot
      </a>

      {(state === 'complete' || run.verdict) && (
        <VerdictSignal verdict={run.verdict} />
      )}

      <div className="identity-check-result__meta">
        <span>{run.created_at ? new Date(run.created_at).toLocaleString() : ''}</span>
        <span>{run.passed_count}/{run.total_count} probes passed</span>
      </div>

      <h4 className="identity-check-result__probes-header">Probe Results</h4>

      <div className="identity-check-result__probes">
        {sortedProbes.map((probe, i) => (
          <ProbeResultRow
            key={probe.label}
            label={probe.label}
            prompt={probe.prompt}
            response={probe.response}
            passed={probe.passed}
            state={getProbeState(i)}
          />
        ))}
      </div>
    </div>
  );
}
