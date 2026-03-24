import '@/styles/molecules.css';

type VersionLineageProps = {
  versionNumber: number;
  parentSnapshotId: string | null;
  snapshotId: string;
};

export default function VersionLineage({
  versionNumber,
  parentSnapshotId,
}: VersionLineageProps) {
  return (
    <span className="version-lineage">
      <span className="version-lineage__version">v{versionNumber}</span>
      <span className="version-lineage__lineage">
        {parentSnapshotId ? 'derived' : 'root snapshot'}
      </span>
    </span>
  );
}
