'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/snapshot.css';

import SnapshotDetail from '@/components/organisms/SnapshotDetail';
import ExportPanel from '@/components/organisms/ExportPanel';
import { getSupabase } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Snapshot = {
  id: string;
  version_number: number;
  parent_snapshot_id: string | null;
  persona_name: string;
  persona_id: string;
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

type Profile = {
  id: string;
  provider: string;
  model_name: string;
  status: string;
  score: number | null;
  created_at: string;
};

export default function SnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [validationStatus, setValidationStatus] = useState<'PASS' | 'FAIL' | 'NO_RUNS'>('NO_RUNS');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('Session expired');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [snapRes, profilesRes] = await Promise.all([
        fetch(`${API_URL}/snapshots/${id}`, { headers }),
        fetch(`${API_URL}/snapshots/${id}/profiles`, { headers }),
      ]);

      if (!snapRes.ok) {
        setError('Snapshot not found');
        setLoading(false);
        return;
      }

      const snapData: Snapshot = await snapRes.json();
      const profilesData: Profile[] = await profilesRes.json();

      setSnapshot(snapData);
      setProfiles(profilesData);

      // Resolve active profile for validation status
      const activeProfiles = profilesData
        .filter((p) => p.status === 'active')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (activeProfiles.length > 0) {
        const activeId = activeProfiles[0].id;
        const valRes = await fetch(
          `${API_URL}/validations/runs?restoration_profile_id=${activeId}&limit=1`,
          { headers }
        );
        if (valRes.ok) {
          const valData = await valRes.json();
          if (valData.run) {
            setValidationStatus(valData.run.verdict);
          }
        }
      }

      setLoading(false);
    } catch {
      setError('Failed to load snapshot');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="snapshot-page">
        <div className="snapshot-page__loading">Loading...</div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="snapshot-page">
        <div className="snapshot-page__error">{error || 'Snapshot not found'}</div>
      </div>
    );
  }

  const activeProfiles = profiles
    .filter((p) => p.status === 'active')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activeProfileId = activeProfiles.length > 0 ? activeProfiles[0].id : null;
  const multipleActiveProfiles = activeProfiles.length > 1;

  const handleCalibrate = async () => {
    setCalibrating(true);
    setCalibrationError(null);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setCalibrationError('Session expired');
        return;
      }
      const res = await fetch(`${API_URL}/snapshots/${id}/calibrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider: 'openai', model_name: 'gpt-4o' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Calibration failed' }));
        setCalibrationError(body.error || 'Calibration failed');
        return;
      }
      await load();
    } catch (err: any) {
      setCalibrationError(err.message || 'Calibration failed');
    } finally {
      setCalibrating(false);
    }
  };

  const handleRunCheck = (profileId: string) => {
    router.push(`/snapshots/${id}/check?profile_id=${profileId}`);
  };

  const exportProfiles = profiles.map((p) => ({
    id: p.id,
    provider: p.provider,
    model_name: p.model_name,
    calibration_score: p.score ?? 0,
    status: p.status,
    runtime_prompt: null as string | null,
  }));

  return (
    <div className="snapshot-page">
      <SnapshotDetail
        snapshot={snapshot}
        validationStatus={validationStatus}
        activeProfileId={activeProfileId}
        multipleActiveProfiles={multipleActiveProfiles}
        profiles={profiles}
        onRunCheck={handleRunCheck}
        onCalibrate={handleCalibrate}
        calibrating={calibrating}
        calibrationError={calibrationError}
      />

      <div className="snapshot-page__export-actions">
        <button className="export-btn" onClick={() => setExportOpen(!exportOpen)}>
          Export
        </button>
      </div>

      {exportOpen && (
        <ExportPanel
          snapshot={snapshot}
          profiles={exportProfiles}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
