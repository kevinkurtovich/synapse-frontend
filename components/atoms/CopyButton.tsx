import '@/styles/atoms.css';

type CopyButtonProps = {
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export default function CopyButton({ copied, onClick, disabled }: CopyButtonProps) {
  const className = copied
    ? 'btn btn-default copy-btn--copied'
    : 'btn btn-default';

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {copied ? 'Copied \u2713' : 'Copy'}
    </button>
  );
}
