'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import ExportPanel from '@/components/organisms/ExportPanel';
import '@/styles/persona-room.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Snapshot = {
  id: string;
  created_at: string;
  distillation_summary: string | null;
  identity_json: Record<string, unknown> | null;
  tone_json: Record<string, unknown> | null;
  interaction_json: Record<string, unknown> | null;
  boundaries_json: Record<string, unknown> | null;
  memory_context_json: Record<string, unknown> | null;
  traits_to_preserve_json: Record<string, unknown> | null;
  traits_to_avoid_json: Record<string, unknown> | null;
  confidence_by_dimension_json: Record<string, unknown> | null;
};

type DriftMonitor = {
  id: string;
  status: string;
  latest_score: number | null;
  drift_threshold: number;
  last_check_at: string | null;
  restoration_profile_id: string | null;
};

type DriftReport = {
  id: string;
  score: number;
  created_at: string;
  source: string;
};

type ValidationRun = {
  id: string;
  verdict: string;
  created_at: string;
};

type PersonaDetail = {
  persona: { id: string; name: string; owner_user_id: string; created_at: string };
  snapshot: Snapshot | null;
  drift_monitor: DriftMonitor | null;
  last_drift_report: DriftReport | null;
  last_validation_run: ValidationRun | null;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'ok';
  if (score >= 60) return 'warn';
  return 'danger';
}

function renderJsonSection(title: string, json: Record<string, unknown> | null) {
  if (!json || Object.keys(json).length === 0) return null;
  return (
    <div className="mb-16">
      <div className="sub-label">{title}</div>
      {Object.entries(json).map(([key, value]) => (
        <div className="kv-row" key={key}>
          <span className="kv-lbl">{key.replace(/_/g, ' ')}</span>
          <span className="kv-val">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
        </div>
      ))}
    </div>
  );
}

function renderTraitList(title: string, json: Record<string, unknown> | null, colorClass: string) {
  if (!json || Object.keys(json).length === 0) return null;
  const items = Array.isArray(json) ? json : (json.items || json.traits || Object.values(json));
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="mb-16">
      <div className="sub-label">{title}</div>
      <div className="flex-row gap-8" style={undefined}>
        {(items as string[]).map((item, i) => (
          <span key={i} className={`pill ${colorClass}`}>{String(item)}</span>
        ))}
      </div>
    </div>
  );
}

export default function PersonaRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PersonaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const hasAutoCalibrated = useRef(false);

  const load = useCallback(async () => {
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setError('Session expired'); setLoading(false); return; }

      const res = await fetch(`${API_URL}/personas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setError('Persona not found'); setLoading(false); return; }

      const detail: PersonaDetail = await res.json();
      setData(detail);
      setLoading(false);

      // Auto-calibrate if snapshot exists but no drift_monitor (no active profile yet)
      if (
        detail.snapshot &&
        !detail.drift_monitor &&
        !hasAutoCalibrated.current
      ) {
        hasAutoCalibrated.current = true;
        setCalibrating(true);
        try {
          const calRes = await fetch(
            `${API_URL}/snapshots/${detail.snapshot.id}/calibrate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ provider: 'openai', model_name: 'gpt-4o' }),
            }
          );
          if (calRes.ok) {
            // Reload to pick up new profile
            const refreshRes = await fetch(`${API_URL}/personas/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (refreshRes.ok) {
              setData(await refreshRes.json());
            }
          }
        } catch {
          // Auto-calibrate failure is non-fatal
        } finally {
          setCalibrating(false);
        }
      }
    } catch {
      setError('Failed to load persona');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="persona-room"><p className="persona-room__loading">Loading...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="persona-room">
        <p className="persona-room__error">{error || 'Persona not found'}</p>
      </div>
    );
  }

  const { persona, snapshot, drift_monitor, last_drift_report, last_validation_run } = data;
  const score = drift_monitor?.latest_score;
  const monitorStatus = drift_monitor?.status;

  // Build export profiles if needed
  const exportProfiles = snapshot ? [] : [];

  return (
    <div className="persona-room">
      {/* Identity Header */}
      <div className="persona-room__identity-header">
        <h1 className="persona-room__name">{persona.name}</h1>
        {snapshot?.distillation_summary && (
          <p className="persona-room__summary">{snapshot.distillation_summary}</p>
        )}
        {!snapshot && (
          <p className="persona-room__no-snapshot">Identity reconstruction in progress...</p>
        )}
      </div>

      {/* Monitoring Status Panel */}
      <div className="card mb-24">
        <div className="card-hd">
          <div className="card-title">Monitoring Status</div>
          <div>
            {calibrating && (
              <span className="badge badge-warn">Setting up monitoring...</span>
            )}
            {!calibrating && monitorStatus === 'healthy' && (
              <span className="badge badge-ok"><span className="dot"></span>Healthy</span>
            )}
            {!calibrating && monitorStatus === 'drift_detected' && (
              <span className="badge badge-warn"><span className="dot"></span>Drift Detected</span>
            )}
            {!calibrating && !monitorStatus && !calibrating && (
              <span className="badge badge-muted">Not yet monitored</span>
            )}
          </div>
        </div>

        {score !== null && score !== undefined && (
          <div className="mb-16">
            <div className="meter-hd">
              <span className="meter-lbl">Fidelity Score</span>
              <span className={`meter-val m-${scoreColor(score)}`}>
                {score.toFixed(1)}
              </span>
            </div>
            <div className="meter-track">
              <div
                className={`meter-fill m-${scoreColor(score)}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        )}

        {drift_monitor?.last_check_at && (
          <div className="kv-row">
            <span className="kv-lbl">Last checked</span>
            <span className="kv-val kv-muted">{relativeTime(drift_monitor.last_check_at)}</span>
          </div>
        )}

        {last_validation_run && (
          <div className="kv-row">
            <span className="kv-lbl">Last identity check</span>
            <span className={`kv-val ${last_validation_run.verdict === 'PASS' ? 'kv-ok' : 'kv-danger'}`}>
              {last_validation_run.verdict}
            </span>
          </div>
        )}

        {calibrating && (
          <p className="persona-room__calibrating">Monitoring initialization in progress...</p>
        )}
      </div>

      {/* Identity Portrait */}
      {snapshot && (
        <div className="card mb-24">
          <div className="card-hd">
            <div className="card-title">Identity Portrait</div>
          </div>

          {snapshot.confidence_by_dimension_json &&
            typeof snapshot.confidence_by_dimension_json === 'object' &&
            Object.keys(snapshot.confidence_by_dimension_json).length > 0 && (
              <div className="mb-16">
                <div className="sub-label">Confidence</div>
                {Object.entries(snapshot.confidence_by_dimension_json).map(([dim, val]) => (
                  <div className="dim-bar" key={dim}>
                    <span className="dim-bar-label">{dim}</span>
                    <div className="dim-bar-track">
                      <div className="dim-bar-fill" style={{ width: `${Number(val)}%` }} />
                    </div>
                    <span className="dim-bar-val">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}

          {renderJsonSection('Tone', snapshot.tone_json)}
          {renderJsonSection('Interaction Style', snapshot.interaction_json)}
          {renderJsonSection('Boundaries', snapshot.boundaries_json)}
          {renderTraitList('Traits to Preserve', snapshot.traits_to_preserve_json, 'pill-ok')}
          {renderTraitList('Traits to Avoid', snapshot.traits_to_avoid_json, 'pill-danger')}
        </div>
      )}

      {/* Primary CTA */}
      {snapshot && (
        <div className="flex-row gap-12 mb-24">
          <Link href={`/personas/${id}/check?profile_id=${drift_monitor?.restoration_profile_id || ''}`} className="btn btn-brand">
            Run Identity Check
          </Link>
          <button className="btn btn-default" onClick={() => setExportOpen(!exportOpen)}>
            Export
          </button>
        </div>
      )}

      {exportOpen && snapshot && (
        <ExportPanel
          snapshot={snapshot}
          profiles={exportProfiles}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
