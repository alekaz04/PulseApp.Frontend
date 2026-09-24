import { afterEach, describe, expect, it } from 'vitest';
import { getUserManager, resetUserManagerForTests } from './userManager';

afterEach(() => {
  resetUserManagerForTests();
  delete window.APP_CONFIG;
});

describe('getUserManager', () => {
  it('настраивает PKCE-клиент Keycloak', () => {
    window.APP_CONFIG = { OIDC_AUTHORITY: 'http://localhost:8080/realms/pulse-app', OIDC_CLIENT_ID: 'pulse-web' };

    const { settings } = getUserManager();

    expect(settings.authority).toBe('http://localhost:8080/realms/pulse-app');
    expect(settings.client_id).toBe('pulse-web');
    expect(settings.redirect_uri).toBe('http://localhost:3000/auth/callback');
    expect(settings.post_logout_redirect_uri).toBe('http://localhost:3000/');
    expect(settings.response_type).toBe('code');
    expect(settings.scope).toBe('openid profile email');
    expect(settings.automaticSilentRenew).toBe(true);
  });

  it('возвращает один и тот же экземпляр', () => {
    window.APP_CONFIG = { OIDC_AUTHORITY: 'http://kc/realms/pulse-app', OIDC_CLIENT_ID: 'pulse-web' };
    expect(getUserManager()).toBe(getUserManager());
  });

  it('без конфига бросает понятную ошибку', () => {
    expect(() => getUserManager()).toThrow('Не заданы OIDC_AUTHORITY и OIDC_CLIENT_ID в config.js');
  });
});
