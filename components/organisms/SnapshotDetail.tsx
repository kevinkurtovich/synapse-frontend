'use client';

import '@/styles/atoms.css';
import '@/styles/molecules.css';
import '@/styles/organisms.css';

import ValidationStatusBadge from '@/components/atoms/ValidationStatusBadge';
import VersionLineage from '@/components/molecules/VersionLineage';
import MemoryContextBlock from '@/components/molecules/MemoryContextBlock';
import IdentityBlock from '@/components/molecules/IdentityBlock';
import TraitSection from '@/components/molecules/TraitSection';
import TestList from '@/components/molecules/TestList';

type FlowState = 'NO_TESTS' | 'NO_PROFILE' | 'NO_VALIDATION' | 'COMPLETE';

type Profile = {
  id: string;
  provider: string;
  model_name: string;
  status: string;
  calibration_score: number | null;
};

type Test = {
  id: string;
  prompt: string;
  expected_traits_json: Record<string, unknown> | null;
  forbidden_traits_json: Record<string, unknown> | null;
  created_at: string;
};

type ValidationRun = {
  id: string;
  verdict: 'PASS' | 'FAIL';
  passed_count: number;
  total_count: number;
};

type SnapshotDetailProps = {
  snapshot: {
    id: string;
    version_number: number;
    parent_snapshot_id: string | null;
    persona_name: string;
    identity_json: Record<string, unknown>;
    memory_context_json: Record<string, unknown> | null;
    tone_json: Record<string, unknown> | null;
    interaction_json: Record<string, unknown> | null;
    boundaries_json: Record<string, unknown> | null;
    traits_to_preserve_json: Record<string, unknown> | null;
    traits_to_avoid_json: Record<string, unknown> | null;
    confidence_by_dimension_json: Record<string, unknown> | null;
    distillation_summary: string | null;
  };
  flowState: FlowState;
  tests: Test[];
  lastRun: ValidationRun | null;
  profiles: Profile[];
  selectedProfileId: string | null;
  multipleActiveProfiles: boolean;
  onSelectProfile: (profileId: string) => void;
  onRunCheck: () => void;
  onCalibrate?: () => void;
  calibrating?: boolean;
  calibrationError?: string | null;
  onAddTest: (prompt: string, expectedText: string, forbiddenText: string) => void;
  addingTest?: boolean;
  addTestError?: string | null;
};

const FLOW_CONFIG: Record<FlowState, { step: string; message: string }> = {
  NO_TESTS: {
    step: 'Step 1 of 3 — Add a test',
    message:
      'This snapshot has no tests. Add at least one test prompt before calibration can run.',
  },
  NO_PROFILE: {
    step: 'Step 2 of 3 — Calibrate',
    message:
      'Tests are ready. Calibrate this snapshot to generate a restoration profile.',
  },
  NO_VALIDATION: {
    step: 'Step 3 of 3 — Run Identity Check',
    message:
      'A calibrated profile is ready. Run an identity check to validate restoration quality.',
  },
  COMPLETE: {
    step: 'Complete',
    message: 'Identity check complete.',
  },
};

export default function SnapshotDetail({
  snapshot,
  flowState,
  tests,
  lastRun,
  profiles,
  selectedProfileId,
  multipleActiveProfiles,
  onSelectProfile,
  onRunCheck,
  onCalibrate,
  calibrating = false,
  calibrationError = null,
  onAddTest,
  addingTest = false,
  addTestError = null,
}: SnapshotDetailProps) {
  const activeProfiles = profiles.filter((p) => p.status === 'active');
  const flow = FLOW_CONFIG[flowState];

  return (
    <div className="snapshot-detail">
      {/* 1. Header */}
      <div className="snapshot-detail__header">
        <h1 className="snapshot-detail__persona-name">{snapshot.persona_name}</h1>
        <VersionLineage
          versionNumber={snapshot.version_number}
          parentSnapshotId={snapshot.parent_snapshot_id}
          snapshotId={snapshot.id}
        />
        <ValidationStatusBadge
          status={
            flowState === 'COMPLETE' && lastRun
              ? lastRun.verdict
              : 'NO_RUNS'
          }
        />
      </div>

      {/* 2. Directive Flow Panel */}
      <div className="snapshot-flow">
        <div className="snapshot-flow__step-label">{flow.step}</div>
        <div className="snapshot-flow__message">{flow.message}</div>

        <div className="snapshot-flow__actions">
          {flowState === 'NO_TESTS' && (
            <span className="snapshot-flow__hint">
              Use the test panel below to add your first test.
            </span>
          )}

          {flowState === 'NO_PROFILE' && onCalibrate && (
            <>
              <button
                className="btn btn-brand"
                onClick={onCalibrate}
                disabled={calibrating}
              >
                {calibrating ? 'Calibrating...' : 'Calibrate'}
              </button>
              {calibrationError && (
                <p className="snapshot-flow__error">{calibrationError}</p>
              )}
            </>
          )}

          {flowState === 'NO_VALIDATION' && (
            <>
              {multipleActiveProfiles && (
                <select
                  className="snapshot-detail__profile-select"
                  value={selectedProfileId || ''}
                  onChange={(e) => onSelectProfile(e.target.value)}
                >
                  {activeProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.provider} / {p.model_name}
                    </option>
                  ))}
                </select>
              )}
              <button
                className="btn btn-brand"
                onClick={onRunCheck}
                disabled={!selectedProfileId}
              >
                Run Identity Check
              </button>
            </>
          )}

          {flowState === 'COMPLETE' && lastRun && (
            <>
              <div
                className={`snapshot-flow__verdict--${lastRun.verdict === 'PASS' ? 'pass' : 'fail'}`}
              >
                {lastRun.verdict} — {lastRun.passed_count}/{lastRun.total_count} probes passed
              </div>
              <button
                className="btn btn-default"
                onClick={onRunCheck}
                disabled={!selectedProfileId}
              >
                Run Again
              </button>
              {multipleActiveProfiles && (
                <select
                  className="snapshot-detail__profile-select"
                  value={selectedProfileId || ''}
                  onChange={(e) => onSelectProfile(e.target.value)}
                >
                  {activeProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.provider} / {p.model_name}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* 3. TestList — always visible, auto-opens form on NO_TESTS */}
      <TestList
        tests={tests}
        onAddTest={onAddTest}
        addingTest={addingTest}
        addTestError={addTestError}
        autoOpenForm={flowState === 'NO_TESTS'}
      />

      {/* 4. Profiles */}
      {profiles.length > 0 && (
        <div className="snapshot-profiles">
          <h2 className="snapshot-profiles__title">Restoration Profiles</h2>
          {profiles.map((p) => (
            <div key={p.id} className="snapshot-profile-card">
              <span className="snapshot-profile-card__name">
                {p.provider} / {p.model_name}
              </span>
              <span
                className={`snapshot-profile-card__status--${p.status}`}
              >
                {p.status}
              </span>
              {p.calibration_score !== null && (
                <span className="snapshot-profile-card__score">
                  {(p.calibration_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. Memory Context */}
      <MemoryContextBlock memoryContextJson={snapshot.memory_context_json} />

      {/* 6. Identity */}
      <IdentityBlock identityJson={snapshot.identity_json || {}} />

      {/* 7. Trait sections */}
      <div className="snapshot-detail__traits-grid">
        <TraitSection title="Tone" traitJson={snapshot.tone_json} />
        <TraitSection title="Interaction" traitJson={snapshot.interaction_json} />
        <TraitSection title="Boundaries" traitJson={snapshot.boundaries_json} />
        <TraitSection title="Traits to Preserve" traitJson={snapshot.traits_to_preserve_json} />
        <TraitSection title="Traits to Avoid" traitJson={snapshot.traits_to_avoid_json} />
      </div>

      {/* 8. Distillation summary */}
      {snapshot.distillation_summary && (
        <div className="snapshot-detail__summary">
          {snapshot.distillation_summary}
        </div>
      )}
    </div>
  );
}
