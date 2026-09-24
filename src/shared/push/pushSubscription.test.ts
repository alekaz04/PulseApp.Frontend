import { describe, expect, it } from 'vitest';
import { fakeRegistration, fakeSubscription } from '../../test/fakePush';
import { mockPublicApi } from '../../test/publicApiMock';
import { readRecord, writeRecord } from './localRecord';
import { createFreshSubscription, toPushKeys, unsubscribeDevice, urlBase64ToUint8Array } from './pushSubscription';

describe('urlBase64ToUint8Array', () => {
  it('декодирует base64url без паддинга', () => {
    expect(Array.from(urlBase64ToUint8Array('AQAB'))).toEqual([1, 0, 1]);
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255]);
  });
});

describe('toPushKeys', () => {
  it('бросает ошибку на неполной подписке', () => {
    const broken = { toJSON: () => ({ endpoint: 'https://push.example/1', keys: {} }) } as unknown as PushSubscription;
    expect(() => toPushKeys(broken)).toThrow('Браузер вернул неполную push-подписку');
  });
});

describe('createFreshSubscription', () => {
  it('удаляет старую подписку и создаёт новую с VAPID-ключом', async () => {
    mockPublicApi();
    const old = fakeSubscription('https://push.example/old');
    const { registration, pushManager } = fakeRegistration({ current: old.subscription });

    const keys = await createFreshSubscription(registration);

    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 0, 1]),
    });
    expect(keys).toEqual({ endpoint: 'https://push.example/new', p256dh: 'p256-key', auth: 'auth-key' });
  });

  it('без старой подписки просто создаёт новую', async () => {
    mockPublicApi();
    const { registration, pushManager } = fakeRegistration();

    await createFreshSubscription(registration);

    expect(pushManager.subscribe).toHaveBeenCalledOnce();
  });
});

describe('unsubscribeDevice', () => {
  it('сообщает бэкенду, удаляет браузерную подписку и локальную запись', async () => {
    const calls = mockPublicApi();
    const current = fakeSubscription('https://push.example/old');
    const { registration } = fakeRegistration({ current: current.subscription });
    writeRecord('CODE-1', 'https://push.example/old');

    await expect(unsubscribeDevice(registration)).resolves.toEqual({ backendOk: true });

    expect(calls.unsubscribe).toEqual([{ endpoint: 'https://push.example/old', authorization: null }]);
    expect(current.unsubscribe).toHaveBeenCalledOnce();
    expect(readRecord()).toBeNull();
  });

  it('ошибка бэкенда не мешает отписать устройство', async () => {
    mockPublicApi({ unsubscribeStatus: 500 });
    const current = fakeSubscription();
    const { registration } = fakeRegistration({ current: current.subscription });

    await expect(unsubscribeDevice(registration)).resolves.toEqual({ backendOk: false });
    expect(current.unsubscribe).toHaveBeenCalledOnce();
  });

  it('без браузерной подписки бэкенд не трогает', async () => {
    const calls = mockPublicApi();
    const { registration } = fakeRegistration();

    await unsubscribeDevice(registration);

    expect(calls.unsubscribe).toEqual([]);
  });
});
