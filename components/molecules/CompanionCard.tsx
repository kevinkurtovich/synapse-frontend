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
    <Link href={`/snapshots/${id}`} className="companion-card">
      <p className="companion-card__name">{name}</p>
      <p className="companion-card__date">{formatted}</p>
    </Link>
  );
}
