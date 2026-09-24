/**
 * Куда вернуть автора после входа: только на страницы кабинета, иначе — в начало кабинета.
 */
export function safeReturnTo(state: unknown): string {
  const returnTo = (state as { returnTo?: unknown } | null | undefined)?.returnTo;
  return typeof returnTo === 'string' && returnTo.startsWith('/app') ? returnTo : '/app';
}
