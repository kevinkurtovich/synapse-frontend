import '@/styles/molecules.css';

type ProbeResultRowProps = {
  label: string;
  prompt: string;
  response: string;
  passed: boolean;
  state: 'pending' | 'running' | 'complete';
};

function getRowClass(state: ProbeResultRowProps['state'], passed: boolean): string {
  if (state === 'pending') return 'probe-row probe-row--pending';
  if (state === 'running') return 'probe-row probe-row--running';
  return passed ? 'probe-row probe-row--complete-pass' : 'probe-row probe-row--complete-fail';
}

function getStatusClass(state: ProbeResultRowProps['state'], passed: boolean): string {
  if (state === 'pending') return 'probe-row__status probe-row__status--pending';
  if (state === 'running') return 'probe-row__status probe-row__status--running';
  return passed
    ? 'probe-row__status probe-row__status--pass'
    : 'probe-row__status probe-row__status--fail';
}

function getStatusLabel(state: ProbeResultRowProps['state'], passed: boolean): string {
  if (state === 'pending') return '\u25CB';
  if (state === 'running') return '\u2026';
  return passed ? 'pass' : 'fail';
}

export default function ProbeResultRow({
  label,
  prompt,
  response,
  passed,
  state,
}: ProbeResultRowProps) {
  return (
    <div className={getRowClass(state, passed)}>
      <div className="probe-row__header">
        <span className="probe-row__label">{label}</span>
        <span className={getStatusClass(state, passed)}>
          {getStatusLabel(state, passed)}
        </span>
      </div>
      <div className="probe-row__prompt">{prompt}</div>
      {state === 'complete' && response && (
        <div className="probe-row__response">{response}</div>
      )}
    </div>
  );
}
