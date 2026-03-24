import '@/styles/atoms.css';

type RunIdentityCheckButtonProps = {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
};

export default function RunIdentityCheckButton({
  onClick,
  disabled,
  loading,
}: RunIdentityCheckButtonProps) {
  const className = [
    'run-check-btn',
    loading ? 'run-check-btn--loading' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Running\u2026' : 'Run Identity Check'}
    </button>
  );
}
