import Link from 'next/link';
import '@/styles/companion-card.css';

type CompanionCardProps = {
  id: string;
  name: string;
  created_at: string;
};

export default function CompanionCard({ id, name, created_at }: CompanionCardProps) {
  const formatted = new Date(created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link className="companion-card card" href={`/snapshots/${id}`}>
      <div className="card-hd">
        <div>
          <div className="breadcrumb">
            <span className="bc-active">{name}</span>
          </div>
          <div className="card-title">{name || 'Unnamed'}</div>
          <div className="card-subtitle">{formatted}</div>
        </div>
      </div>
    </Link>
  );
}
