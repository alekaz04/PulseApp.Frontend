type RawConfig = {
  API_BASE_URL?: string;
  OIDC_AUTHORITY?: string;
  OIDC_CLIENT_ID?: string;
};

declare global {
  interface Window {
    APP_CONFIG?: RawConfig;
  }
}

/**
 * Базовый адрес API без завершающего «/». Пустое значение — тот же origin
 * (прод за nginx, dev через proxy Vite).
 */
export function getApiBaseUrl(): string {
  const raw = window.APP_CONFIG?.API_BASE_URL?.trim() ?? '';
  const base = raw === '' ? window.location.origin : raw;
  return base.replace(/\/+$/, '');
}

/**
 * Настройки OIDC-клиента. Вызывать только из кабинета: страница подписки их не читает.
 */
export function getOidcConfig(): { authority: string; clientId: string } {
  const authority = window.APP_CONFIG?.OIDC_AUTHORITY?.trim() ?? '';
  const clientId = window.APP_CONFIG?.OIDC_CLIENT_ID?.trim() ?? '';
  if (!authority || !clientId) {
    throw new Error('Не заданы OIDC_AUTHORITY и OIDC_CLIENT_ID в config.js');
  }
  return { authority, clientId };
}
