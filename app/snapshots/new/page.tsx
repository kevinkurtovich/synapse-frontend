'use client';
import { useRouter } from 'next/navigation';
import { CreateSnapshotForm } from '../../../components/organisms/CreateSnapshotForm';

export default function NewSnapshotPage() {
  const router = useRouter();

  function handleCreated(snapshotId: string) {
    router.push(`/snapshots/${snapshotId}`);
  }

  return (
    <div className="new-snapshot-page">
      <h1 className="new-snapshot-page__title">New snapshot</h1>
      <CreateSnapshotForm onCreated={handleCreated} />
    </div>
  );
}
