export function trimOrEmpty(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = trimOrEmpty(value);
  return trimmed.length > 0 ? trimmed : null;
}

export function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || fullName;
}
