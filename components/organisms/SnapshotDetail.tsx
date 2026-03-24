'use client';

import { useState } from 'react';
import '@/styles/atoms.css';
import '@/styles/molecules.css';
import '@/styles/organisms.css';

import ValidationStatusBadge from '@/components/atoms/ValidationStatusBadge';
import RunIdentityCheckButton from '@/components/atoms/RunIdentityCheckButton';
import VersionLineage from '@/components/molecules/VersionLineage';
import MemoryContextBlock from '@/components/molecules/MemoryContextBlock';
import IdentityBlock from '@/components/molecules/IdentityBlock';
import TraitSection from '@/components/molecules/TraitSection';

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
  validationStatus: 'PASS' | 'FAIL' | 'NO_RUNS';
  activeProfileId: string | null;
  multipleActiveProfiles: boolean;
  profiles: Array<{ id: string; provider: string; model_name: string; status: string }>;
  onRunCheck: (profileId: string) => void;
};

export default function SnapshotDetail({
  snapshot,
  validationStatus,
  activeProfileId,
  multipleActiveProfiles,
  profiles,
  onRunCheck,
}: SnapshotDetailProps) {
  const activeProfiles = profiles.filter((p) => p.status === 'active');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    activeProfileId || ''
  );

  const handleRunCheck = () => {
    const profileId = multipleActiveProfiles ? selectedProfileId : activeProfileId;
    if (profileId) onRunCheck(profileId);
  };

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
        <ValidationStatusBadge status={validationStatus} />
      </div>

      {/* 2. Run Identity Check */}
      <div className="snapshot-detail__actions">
        {multipleActiveProfiles && (
          <select
            className="snapshot-detail__profile-select"
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
          >
            {activeProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.provider} / {p.model_name}
              </option>
            ))}
          </select>
        )}
        <RunIdentityCheckButton
          onClick={handleRunCheck}
          disabled={!activeProfileId}
          loading={false}
        />
      </div>

      {/* 3. Memory Context — first-class, above traits */}
      <MemoryContextBlock memoryContextJson={snapshot.memory_context_json} />

      {/* 4. Identity */}
      <IdentityBlock identityJson={snapshot.identity_json || {}} />

      {/* 5. Trait sections — 2-column grid on wide viewports */}
      <div className="snapshot-detail__traits-grid">
        <TraitSection title="Tone" traitJson={snapshot.tone_json} />
        <TraitSection title="Interaction" traitJson={snapshot.interaction_json} />
        <TraitSection title="Boundaries" traitJson={snapshot.boundaries_json} />
        <TraitSection title="Traits to Preserve" traitJson={snapshot.traits_to_preserve_json} />
        <TraitSection title="Traits to Avoid" traitJson={snapshot.traits_to_avoid_json} />
      </div>

      {/* 6. Distillation summary */}
      {snapshot.distillation_summary && (
        <div className="snapshot-detail__summary">
          {snapshot.distillation_summary}
        </div>
      )}
    </div>
  );
}
