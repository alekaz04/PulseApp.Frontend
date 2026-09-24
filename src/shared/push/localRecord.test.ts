import { describe, expect, it } from 'vitest';
import { clearRecord, readRecord, writeRecord } from './localRecord';

describe('localRecord', () => {
  it('сохраняет и читает запись', () => {
    writeRecord('CODE-1', 'https://push.example/1', new Date('2026-09-24T10:00:00Z'));

    expect(readRecord()).toEqual({
      code: 'CODE-1',
      endpoint: 'https://push.example/1',
      subscribedAt: '2026-09-24T10:00:00.000Z',
    });
    expect(localStorage.getItem('pulse.subscription')).toContain('"code":"CODE-1"');
  });

  it('битый JSON — записи нет', () => {
    localStorage.setItem('pulse.subscription', '{oops');
    expect(readRecord()).toBeNull();
  });

  it('запись без нужных полей — записи нет', () => {
    localStorage.setItem('pulse.subscription', JSON.stringify({ code: 'X' }));
    expect(readRecord()).toBeNull();
  });

  it('clearRecord удаляет запись', () => {
    writeRecord('CODE-1', 'https://push.example/1');
    clearRecord();
    expect(readRecord()).toBeNull();
  });
});
