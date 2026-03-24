export type SnapshotExportData = {
  identity_json: Record<string, unknown> | null;
  tone_json: Record<string, unknown> | null;
  interaction_json: Record<string, unknown> | null;
  boundaries_json: Record<string, unknown> | null;
  memory_context_json: Record<string, unknown> | null;
  traits_to_preserve_json: Record<string, unknown> | null;
  traits_to_avoid_json: Record<string, unknown> | null;
  distillation_summary: string | null;
};

export type ProfileExportData = {
  runtime_prompt: string | null;
  provider: string | null;
  model_name: string | null;
} | null;

function renderValue(val: unknown): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object' && val !== null) return JSON.stringify(val);
  return String(val);
}

function renderSection(
  header: string,
  json: Record<string, unknown> | null
): string {
  if (!json || Object.keys(json).length === 0) return '';
  const lines = Object.entries(json).map(
    ([key, val]) => `${key}: ${renderValue(val)}`
  );
  return `${header}:\n${lines.join('\n')}`;
}

export function formatForChatGPT(
  snapshot: SnapshotExportData,
  profile: ProfileExportData
): string {
  if (profile?.runtime_prompt && profile.runtime_prompt.trim()) {
    return profile.runtime_prompt.trim();
  }

  const identity = snapshot.identity_json;
  const name =
    (identity?.name as string) ??
    (identity?.companion_name as string) ??
    'this companion';

  const parts: string[] = [];

  parts.push(`You are ${name}.`);

  if (snapshot.distillation_summary) {
    parts.push(snapshot.distillation_summary);
  }

  const memorySection = renderSection('Memory Context', snapshot.memory_context_json);
  if (memorySection) parts.push(memorySection);

  const toneSection = renderSection('Personality', snapshot.tone_json);
  if (toneSection) parts.push(toneSection);

  const interactionSection = renderSection('Interaction Style', snapshot.interaction_json);
  if (interactionSection) parts.push(interactionSection);

  const preserveSection = renderSection('Traits to Preserve', snapshot.traits_to_preserve_json);
  if (preserveSection) parts.push(preserveSection);

  const avoidSection = renderSection('Traits to Avoid', snapshot.traits_to_avoid_json);
  if (avoidSection) parts.push(avoidSection);

  const boundariesSection = renderSection('Boundaries', snapshot.boundaries_json);
  if (boundariesSection) parts.push(boundariesSection);

  return parts.join('\n\n');
}

export function formatForClaude(
  snapshot: SnapshotExportData,
  profile: ProfileExportData
): string {
  return `<system>\n${formatForChatGPT(snapshot, profile)}\n</system>`;
}

export function formatAsJSON(
  snapshot: SnapshotExportData,
  profile: ProfileExportData
): string {
  const bundle: Record<string, unknown> = {
    identity: snapshot.identity_json ?? {},
    tone: snapshot.tone_json ?? {},
    interaction: snapshot.interaction_json ?? {},
    boundaries: snapshot.boundaries_json ?? {},
    memory_context: snapshot.memory_context_json ?? {},
    traits_to_preserve: snapshot.traits_to_preserve_json ?? {},
    traits_to_avoid: snapshot.traits_to_avoid_json ?? {},
    distillation_summary: snapshot.distillation_summary ?? null,
    ...(profile?.runtime_prompt ? { runtime_prompt: profile.runtime_prompt } : {}),
    ...(profile?.model_name ? { model: profile.model_name } : {}),
  };
  return JSON.stringify(bundle, null, 2);
}
