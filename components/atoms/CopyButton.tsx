import '@/styles/atoms.css';

type CopyButtonProps = {
  copied: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export default function CopyButton({ copied, onClick, disabled }: CopyButtonProps) {
  const className = disabled
    ? 'copy-btn copy-btn--disabled'
    : copied
      ? 'copy-btn copy-btn--copied'
      : 'copy-btn';

  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {copied ? 'Copied \u2713' : 'Copy'}
    </button>
  );
}
