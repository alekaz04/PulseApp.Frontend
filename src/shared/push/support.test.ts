import { describe, expect, it } from 'vitest';
import { detectPlatform, isIosPushCapable, readPlatformEnv, type PlatformEnv, type PlatformInfo } from './support';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

function env(overrides: Partial<PlatformEnv>): PlatformEnv {
  return {
    userAgent: '',
    maxTouchPoints: 0,
    navigatorStandalone: undefined,
    displayModeStandalone: false,
    hasServiceWorker: true,
    hasPushManager: true,
    hasNotification: true,
    ...overrides,
  };
}

function ios(major: number, minor: number): PlatformInfo {
  return { isIos: true, iosVersion: { major, minor }, isStandalone: true, pushSupported: true };
}

describe('detectPlatform', () => {
  it('iPhone во вкладке Safari', () => {
    expect(detectPlatform(env({ userAgent: IPHONE_SAFARI, maxTouchPoints: 5, hasPushManager: false }))).toEqual({
      isIos: true,
      iosVersion: { major: 17, minor: 5 },
      isStandalone: false,
      pushSupported: false,
    });
  });

  it('iPhone, приложение с экрана «Домой»', () => {
    const platform = detectPlatform(env({ userAgent: IPHONE_SAFARI, maxTouchPoints: 5, navigatorStandalone: true }));
    expect(platform.isStandalone).toBe(true);
    expect(platform.pushSupported).toBe(true);
  });

  it('iPad в режиме «как на компьютере» — это iOS', () => {
    const platform = detectPlatform(env({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 5 }));
    expect(platform.isIos).toBe(true);
    expect(platform.iosVersion).toEqual({ major: 17, minor: 5 });
  });

  it('Mac без тачскрина — не iOS', () => {
    expect(detectPlatform(env({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 0 })).isIos).toBe(false);
  });

  it('Android Chrome', () => {
    expect(detectPlatform(env({ userAgent: ANDROID_CHROME }))).toEqual({
      isIos: false,
      iosVersion: null,
      isStandalone: false,
      pushSupported: true,
    });
  });

  it('установленное PWA на Android (display-mode: standalone)', () => {
    expect(detectPlatform(env({ userAgent: ANDROID_CHROME, displayModeStandalone: true })).isStandalone).toBe(true);
  });

  it('в jsdom push не поддерживается', () => {
    expect(detectPlatform(readPlatformEnv()).pushSupported).toBe(false);
  });
});

describe('isIosPushCapable', () => {
  it.each([
    [15, 7, false],
    [16, 3, false],
    [16, 4, true],
    [17, 0, true],
    [18, 6, true],
  ])('iOS %i.%i → %s', (major, minor, expected) => {
    expect(isIosPushCapable(ios(major, minor))).toBe(expected);
  });

  it('не iOS — подходит', () => {
    expect(isIosPushCapable({ isIos: false, iosVersion: null, isStandalone: false, pushSupported: true })).toBe(true);
  });

  it('неизвестная версия iOS — считаем подходящей', () => {
    expect(isIosPushCapable({ isIos: true, iosVersion: null, isStandalone: true, pushSupported: true })).toBe(true);
  });
});
