import '@/styles/molecules.css';

type MemoryContextBlockProps = {
  memoryContextJson: Record<string, unknown> | null;
};

export default function MemoryContextBlock({ memoryContextJson }: MemoryContextBlockProps) {
  const isEmpty =
    !memoryContextJson || Object.keys(memoryContextJson).length === 0;

  return (
    <div className="memory-context-block">
      <h4 className="memory-context-block__title">Memory Context</h4>
      {isEmpty ? (
        <span className="memory-context-block__empty">
          No memory context defined
        </span>
      ) : (
        Object.entries(memoryContextJson).map(([key, val]) => (
          <div key={key} className="memory-context-block__field">
            <span className="memory-context-block__label">{key}</span>
            <span className="memory-context-block__value">
              {typeof val === 'string' ? val : JSON.stringify(val)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
