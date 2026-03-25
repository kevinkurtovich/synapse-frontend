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
  return (
    <button
      className="btn btn-brand"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Running\u2026' : 'Run Identity Check'}
    </button>
  );
}
