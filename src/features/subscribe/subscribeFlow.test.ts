import { describe, expect, it } from 'vitest';
import type { PlatformInfo } from '../../shared/push/support';
import { resolvePlatformState, resolveSubscriptionState } from './subscribeFlow';

const record = { code: 'CODE-1', endpoint: 'https://push.example/old', subscribedAt: '2026-09-24T10:00:00.000Z' };

function platform(overrides: Partial<PlatformInfo>): PlatformInfo {
  return { isIos: false, iosVersion: null, isStandalone: false, pushSupported: true, ...overrides };
}

describe('resolvePlatformState', () => {
  it('iOS старше 16.4 — не поддерживается, с подсказкой обновиться', () => {
    expect(resolvePlatformState(platform({ isIos: true, iosVersion: { major: 15, minor: 7 } }))).toEqual({
      kind: 'unsupported',
      oldIos: true,
    });
  });

  it('iOS во вкладке Safari — инструкция «На экран Домой»', () => {
    expect(
      resolvePlatformState(platform({ isIos: true, iosVersion: { major: 17, minor: 5 }, pushSupported: false })),
    ).toEqual({ kind: 'ios-install' });
  });

  it('браузер без push — не поддерживается', () => {
    expect(resolvePlatformState(platform({ pushSupported: false }))).toEqual({ kind: 'unsupported', oldIos: false });
  });

  it('iOS-приложение с экрана «Домой» с push — можно продолжать', () => {
    expect(
      resolvePlatformState(platform({ isIos: true, iosVersion: { major: 17, minor: 5 }, isStandalone: true })),
    ).toBeNull();
  });

  it('обычный браузер с push — можно продолжать', () => {
    expect(resolvePlatformState(platform({}))).toBeNull();
  });
});

describe('resolveSubscriptionState', () => {
  it('нет записи — ready', () => {
    expect(resolveSubscriptionState('CODE-1', null, null)).toEqual({ state: { kind: 'ready' }, clearRecord: false });
  });

  it('запись по этому коду и тот же endpoint — subscribed', () => {
    expect(resolveSubscriptionState('CODE-1', 'https://push.example/old', record)).toEqual({
      state: { kind: 'subscribed' },
      clearRecord: false,
    });
  });

  it('запись по другому коду и браузерная подписка есть — other-author', () => {
    expect(resolveSubscriptionState('CODE-2', 'https://push.example/old', record)).toEqual({
      state: { kind: 'other-author' },
      clearRecord: false,
    });
  });

  it('запись есть, а браузерной подписки нет — запись удаляется, ready', () => {
    expect(resolveSubscriptionState('CODE-1', null, record)).toEqual({ state: { kind: 'ready' }, clearRecord: true });
  });

  it('браузерная подписка без записи — ready (будет пересоздана)', () => {
    expect(resolveSubscriptionState('CODE-1', 'https://push.example/orphan', null)).toEqual({
      state: { kind: 'ready' },
      clearRecord: false,
    });
  });
});
