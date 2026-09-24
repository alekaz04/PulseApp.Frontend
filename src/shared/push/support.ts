export type IosVersion = { major: number; minor: number };

export type PlatformInfo = {
  isIos: boolean;
  /** Версия iOS или null, если это не iOS или версию не удалось определить */
  iosVersion: IosVersion | null;
  /** Запущено как приложение с экрана «Домой» */
  isStandalone: boolean;
  /** Есть Service Worker, PushManager и Notification */
  pushSupported: boolean;
};

export type PlatformEnv = {
  userAgent: string;
  maxTouchPoints: number;
  /** navigator.standalone — есть только в Safari на iOS */
  navigatorStandalone: boolean | undefined;
  displayModeStandalone: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
};

export function readPlatformEnv(): PlatformEnv {
  return {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone,
    displayModeStandalone:
      typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    hasNotification: 'Notification' in window,
  };
}

function parseIosVersion(userAgent: string): IosVersion | null {
  const match = userAgent.match(/OS (\d+)_(\d+)/) ?? userAgent.match(/Version\/(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function detectPlatform(env: PlatformEnv = readPlatformEnv()): PlatformInfo {
  // iPadOS 13+ в режиме «как на компьютере» представляется Mac'ом с тачскрином
  const isIos =
    /iPhone|iPad|iPod/.test(env.userAgent) || (/Macintosh/.test(env.userAgent) && env.maxTouchPoints > 1);

  return {
    isIos,
    iosVersion: isIos ? parseIosVersion(env.userAgent) : null,
    isStandalone: env.navigatorStandalone === true || env.displayModeStandalone,
    pushSupported: env.hasServiceWorker && env.hasPushManager && env.hasNotification,
  };
}

/**
 * Web Push на iOS есть с 16.4. Неизвестную версию считаем подходящей.
 */
export function isIosPushCapable(platform: PlatformInfo): boolean {
  if (!platform.isIos || !platform.iosVersion) {
    return true;
  }
  const { major, minor } = platform.iosVersion;
  return major > 16 || (major === 16 && minor >= 4);
}
