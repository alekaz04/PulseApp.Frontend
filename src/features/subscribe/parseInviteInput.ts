const CODE_PATTERN = /^[A-Za-z0-9-]{4,64}$/;

/**
 * Достаёт код приглашения из вставленной ссылки (или принимает сам код).
 * null — текст не похож на ссылку Pulse.
 */
export function parseInviteInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  const fromUrl = value.match(/\/s\/([^/?#\s]+)/)?.[1];
  let candidate = fromUrl ?? value;
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return null;
  }
  return CODE_PATTERN.test(candidate) ? candidate : null;
}
