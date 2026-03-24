import '@/styles/molecules.css';

type IdentityBlockProps = {
  identityJson: Record<string, unknown>;
};

export default function IdentityBlock({ identityJson }: IdentityBlockProps) {
  const name =
    (identityJson.name as string) ||
    (identityJson.companion_name as string) ||
    'Unknown';

  const fields = Object.entries(identityJson).filter(
    ([key, val]) => key !== 'name' && key !== 'companion_name' && typeof val === 'string'
  );

  return (
    <div className="identity-block">
      <h3 className="identity-block__name">{name}</h3>
      {fields.map(([key, val]) => (
        <div key={key} className="identity-block__field">
          <span className="identity-block__label">{key}</span>
          <span className="identity-block__value">{val as string}</span>
        </div>
      ))}
    </div>
  );
}
