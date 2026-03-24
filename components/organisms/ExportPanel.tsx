'use client';

import { useState } from 'react';
import '@/styles/atoms.css';
import '@/styles/molecules.css';
import '@/styles/organisms.css';

import CopyButton from '@/components/atoms/CopyButton';
import ExportFormatTab from '@/components/molecules/ExportFormatTab';
import ExportOutput from '@/components/molecules/ExportOutput';
import ExportProfileSelector from '@/components/molecules/ExportProfileSelector';
import {
  formatForChatGPT,
  formatForClaude,
  formatAsJSON,
  type SnapshotExportData,
} from '@/utils/exportFormatters';

type ExportFormat = 'chatgpt' | 'claude' | 'json';

type ExportProfile = {
  id: string;
  provider: string;
  model_name: string;
  calibration_score: number;
  status: string;
  runtime_prompt: string | null;
};

type ExportPanelProps = {
  snapshot: SnapshotExportData;
  profiles: ExportProfile[];
  onClose: () => void;
};

export default function ExportPanel({
  snapshot,
  profiles,
  onClose,
}: ExportPanelProps) {
  const activeProfiles = profiles
    .filter((p) => p.status === 'active')
    .sort((a, b) => b.calibration_score - a.calibration_score);

  const [activeFormat, setActiveFormat] = useState<ExportFormat>('chatgpt');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    activeProfiles.length > 0 ? activeProfiles[0].id : null
  );
  const [copied, setCopied] = useState(false);

  const selectedProfile = activeProfiles.find((p) => p.id === selectedProfileId) ?? null;

  const profileData = selectedProfile
    ? {
        runtime_prompt: selectedProfile.runtime_prompt,
        provider: selectedProfile.provider,
        model_name: selectedProfile.model_name,
      }
    : null;

  const content =
    activeFormat === 'chatgpt'
      ? formatForChatGPT(snapshot, profileData)
      : activeFormat === 'claude'
        ? formatForClaude(snapshot, profileData)
        : formatAsJSON(snapshot, profileData);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="export-panel">
      <div className="export-panel__header">
        <span className="export-panel__title">Export Snapshot</span>
        <button className="export-panel__close" onClick={onClose}>
          &times;
        </button>
      </div>

      {activeProfiles.length > 1 && (
        <ExportProfileSelector
          profiles={activeProfiles}
          selectedId={selectedProfileId}
          onChange={setSelectedProfileId}
        />
      )}

      {activeProfiles.length === 0 && (
        <div className="export-panel__notice">
          No calibrated profile — exporting Snapshot fields only
        </div>
      )}

      <ExportFormatTab
        formats={['chatgpt', 'claude', 'json']}
        active={activeFormat}
        onChange={setActiveFormat}
      />

      <ExportOutput content={content} format={activeFormat} />

      <div className="export-panel__footer">
        <CopyButton copied={copied} onClick={handleCopy} />
      </div>
    </div>
  );
}
