import type { MySubscriptionDto } from '../../shared/api/types';

const UNKNOWN = 'Неизвестное устройство';

function detectDevice(userAgent: string): string | null {
  if (/iPhone|iPod/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'Mac';
  if (/Linux|X11/.test(userAgent)) return 'Linux';
  return null;
}

function detectBrowser(userAgent: string): string | null {
  // Порядок важен: Edge, Opera, Яндекс и Samsung тоже пишут «Chrome/» и «Safari/»
  if (/Edg(?:A|iOS)?\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/YaBrowser\//.test(userAgent)) return 'Яндекс Браузер';
  if (/SamsungBrowser\//.test(userAgent)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS\//.test(userAgent)) return 'Firefox';
  if (/Chrome\/|CriOS\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return null;
}

/**
 * Короткое имя устройства для автора: «iPhone · Safari», «Windows · Chrome».
 */
export function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return UNKNOWN;
  }
  const device = detectDevice(userAgent);
  const browser = detectBrowser(userAgent);
  // Приложение с экрана «Домой» на iOS не пишет «Safari/» в User-Agent
  if ((device === 'iPhone' || device === 'iPad') && !browser) {
    return `${device} · веб-приложение`;
  }
  if (!device && !browser) {
    return UNKNOWN;
  }
  return [device, browser].filter(Boolean).join(' · ');
}

export function sortSubscriptions(items: MySubscriptionDto[]): MySubscriptionDto[] {
  return [...items].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}
