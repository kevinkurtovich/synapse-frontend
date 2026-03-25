import Link from 'next/link';
import '@/styles/companion-card.css';

type CompanionCardProps = {
  id: string;
  name: string;
  created_at: string;
  latest_score: number | null;
  monitor_status: string | null;
  last_check_at: string | null;
  model_name: string | null;
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

export default function CompanionCard({
  id,
  name,
  created_at,
  latest_score,
  monitor_status,
  last_check_at,
  model_name,
}: CompanionCardProps) {
  const formatted = new Date(created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const badgeClass =
    monitor_status === 'healthy'
      ? 'badge badge-ok'
      : monitor_status === 'drift_detected'
        ? 'badge badge-warn'
        : 'badge badge-muted';

  const badgeLabel =
    monitor_status === 'healthy'
      ? 'Healthy'
      : monitor_status === 'drift_detected'
        ? 'Drift'
        : 'Setup';

  return (
    <Link className="companion-card card" href={`/personas/${id}`}>
      <div className="card-hd">
        <div>
          <div className="card-title">{name || 'Unnamed'}</div>
          <div className="card-subtitle">{formatted}</div>
        </div>
        <div className="card-hd-right">
          <span className={badgeClass}><span className="dot"></span>{badgeLabel}</span>
        </div>
      </div>
      {(latest_score !== null || model_name || last_check_at) && (
        <div>
          {latest_score !== null && (
            <div className="kv-row">
              <span className="kv-lbl">Score</span>
              <span className={`kv-val ${latest_score >= 80 ? 'kv-ok' : latest_score >= 60 ? 'kv-brand' : 'kv-danger'}`}>
                {latest_score.toFixed(1)}
              </span>
            </div>
          )}
          {model_name && (
            <div className="kv-row">
              <span className="kv-lbl">Model</span>
              <span className="kv-val kv-brand">{model_name}</span>
            </div>
          )}
          {last_check_at && (
            <div className="kv-row">
              <span className="kv-lbl">Checked</span>
              <span className="kv-val kv-muted">{relativeTime(last_check_at)}</span>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
