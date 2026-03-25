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
  calibration_score: number | null;
  created_at: string;
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

type FlowState = 'NO_TESTS' | 'NO_PROFILE' | 'NO_VALIDATION' | 'COMPLETE';

function deriveFlowState(
  tests: Test[],
  profiles: Profile[],
  lastRun: ValidationRun | null
): FlowState {
  if (tests.length === 0) return 'NO_TESTS';
  if (profiles.filter((p) => p.status === 'active').length === 0) return 'NO_PROFILE';
  if (!lastRun) return 'NO_VALIDATION';
  return 'COMPLETE';
}

export default function SnapshotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [lastRun, setLastRun] = useState<ValidationRun | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [addingTest, setAddingTest] = useState(false);
  const [addTestError, setAddTestError] = useState<string | null>(null);

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

      const [snapRes, profilesRes, testsRes] = await Promise.all([
        fetch(`${API_URL}/snapshots/${id}`, { headers }),
        fetch(`${API_URL}/snapshots/${id}/profiles`, { headers }),
        fetch(`${API_URL}/snapshots/${id}/tests`, { headers }),
      ]);

      if (!snapRes.ok) {
        setError('Snapshot not found');
        setLoading(false);
        return;
      }

      const snapData: Snapshot = await snapRes.json();
      const profilesData: Profile[] = profilesRes.ok ? await profilesRes.json() : [];
      const testsData: Test[] = testsRes.ok ? await testsRes.json() : [];

      setSnapshot(snapData);
      setProfiles(profilesData);
      setTests(testsData);

      // Derive selectedProfileId: prefer most recent active, fallback to most recent any
      const sortedProfiles = [...profilesData].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const activeProfiles = sortedProfiles.filter((p) => p.status === 'active');
      const resolvedProfile = activeProfiles.length > 0 ? activeProfiles[0] : sortedProfiles[0];
      const resolvedProfileId = resolvedProfile ? resolvedProfile.id : null;
      setSelectedProfileId(resolvedProfileId);

      // Fetch last validation run for resolved profile
      if (resolvedProfileId) {
        const valRes = await fetch(
          `${API_URL}/validations/runs?restoration_profile_id=${resolvedProfileId}&limit=1`,
          { headers }
        );
        if (valRes.ok) {
          const valData = await valRes.json();
          if (valData.run) {
            setLastRun(valData.run as ValidationRun);
          } else {
            setLastRun(null);
          }
        } else {
          setLastRun(null);
        }
      } else {
        setLastRun(null);
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

  const sortedProfiles = [...profiles].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const activeProfiles = sortedProfiles.filter((p) => p.status === 'active');
  const multipleActiveProfiles = activeProfiles.length > 1;
  const flowState = deriveFlowState(tests, profiles, lastRun);

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

  const handleRunCheck = () => {
    if (!selectedProfileId) return;
    router.push(`/snapshots/${id}/check?profile_id=${selectedProfileId}`);
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    // Re-fetch last run for newly selected profile
    (async () => {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const valRes = await fetch(
        `${API_URL}/validations/runs?restoration_profile_id=${profileId}&limit=1`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (valRes.ok) {
        const valData = await valRes.json();
        setLastRun(valData.run ? (valData.run as ValidationRun) : null);
      }
    })();
  };

  const handleAddTest = async (
    prompt: string,
    expectedText: string,
    forbiddenText: string
  ) => {
    setAddingTest(true);
    setAddTestError(null);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setAddTestError('Session expired');
        return;
      }
      const res = await fetch(`${API_URL}/snapshots/${id}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          expected_traits_json: expectedText ? { description: expectedText } : {},
          forbidden_traits_json: forbiddenText ? { description: forbiddenText } : {},
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to add test' }));
        setAddTestError(body.error || 'Failed to add test');
        return;
      }
      await load();
    } catch (err: any) {
      setAddTestError(err.message || 'Failed to add test');
    } finally {
      setAddingTest(false);
    }
  };

  const exportProfiles = profiles.map((p) => ({
    id: p.id,
    provider: p.provider,
    model_name: p.model_name,
    calibration_score: p.calibration_score ?? 0,
    status: p.status,
    runtime_prompt: null as string | null,
  }));

  return (
    <div className="snapshot-page">
      <SnapshotDetail
        snapshot={snapshot}
        flowState={flowState}
        tests={tests}
        lastRun={lastRun}
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        multipleActiveProfiles={multipleActiveProfiles}
        onSelectProfile={handleSelectProfile}
        onRunCheck={handleRunCheck}
        onCalibrate={handleCalibrate}
        calibrating={calibrating}
        calibrationError={calibrationError}
        onAddTest={handleAddTest}
        addingTest={addingTest}
        addTestError={addTestError}
      />

      <div className="snapshot-page__export-actions">
        <button className="btn btn-default" onClick={() => setExportOpen(!exportOpen)}>
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
