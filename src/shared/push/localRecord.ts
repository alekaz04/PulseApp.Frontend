const STORAGE_KEY = 'pulse.subscription';

/**
 * Запись «это устройство подписано по коду X». Нужна, потому что endpoint подписки
 * на бэкенде уникален: одно устройство — один автор.
 */
export type SubscriptionRecord = {
  code: string;
  endpoint: string;
  subscribedAt: string;
};

export function readRecord(): SubscriptionRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const value = JSON.parse(raw) as Partial<SubscriptionRecord>;
    if (
      typeof value.code === 'string' &&
      typeof value.endpoint === 'string' &&
      typeof value.subscribedAt === 'string'
    ) {
      return { code: value.code, endpoint: value.endpoint, subscribedAt: value.subscribedAt };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeRecord(code: string, endpoint: string, now: Date = new Date()): void {
  const record: SubscriptionRecord = { code, endpoint, subscribedAt: now.toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Хранилище недоступно (приватный режим) — подписка работает и без записи
  }
}

export function clearRecord(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Хранилище недоступно — удалять нечего
  }
}
