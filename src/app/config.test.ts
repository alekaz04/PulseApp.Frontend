import { afterEach, describe, expect, it } from 'vitest';
import { getApiBaseUrl, getOidcConfig } from './config';

afterEach(() => {
  delete window.APP_CONFIG;
});

describe('getApiBaseUrl', () => {
  it('без конфига возвращает текущий origin', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:3000');
  });

  it('пустая строка означает текущий origin', () => {
    window.APP_CONFIG = { API_BASE_URL: '' };
    expect(getApiBaseUrl()).toBe('http://localhost:3000');
  });

  it('убирает завершающие слэши', () => {
    window.APP_CONFIG = { API_BASE_URL: 'https://api.example.com//' };
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });
});

describe('getOidcConfig', () => {
  it('возвращает authority и clientId', () => {
    window.APP_CONFIG = { OIDC_AUTHORITY: 'http://kc/realms/pulse-app', OIDC_CLIENT_ID: 'pulse-web' };
    expect(getOidcConfig()).toEqual({ authority: 'http://kc/realms/pulse-app', clientId: 'pulse-web' });
  });

  it('бросает понятную ошибку, если чего-то нет', () => {
    window.APP_CONFIG = { OIDC_AUTHORITY: 'http://kc/realms/pulse-app' };
    expect(() => getOidcConfig()).toThrow('Не заданы OIDC_AUTHORITY и OIDC_CLIENT_ID в config.js');
  });
});
