import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { getOidcConfig } from '../../app/config';

let instance: UserManager | null = null;

/**
 * Единственный OIDC-клиент кабинета. Создаётся лениво: ошибка конфига проявится только в кабинете.
 */
export function getUserManager(): UserManager {
  if (!instance) {
    const { authority, clientId } = getOidcConfig();
    const origin = window.location.origin;
    instance = new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: `${origin}/auth/callback`,
      post_logout_redirect_uri: `${origin}/`,
      response_type: 'code',
      scope: 'openid profile email',
      // localStorage — чтобы не входить заново при каждом открытии с телефона
      userStore: new WebStorageStateStore({ store: window.localStorage }),
      automaticSilentRenew: true,
    });
  }
  return instance;
}

export function resetUserManagerForTests(): void {
  instance = null;
}
