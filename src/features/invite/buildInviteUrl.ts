export function buildInviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, '')}/s/${encodeURIComponent(code)}`;
}
