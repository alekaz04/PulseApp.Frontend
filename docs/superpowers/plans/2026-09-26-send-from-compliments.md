# Отправка со страницы «Комплименты» и имя подписчика — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести отправку одного комплимента на страницу «Комплименты» (с выбором получателя и недоступными отправленными комплиментами) и перевести фронт на новый API бэкенда: код приглашения с именем, имя подписчика в списках.

**Architecture:** Окно `SendComplimentDialog` и мутация `useSendCompliment` переезжают из `features/subscribers/` в `features/compliments/`; окно само загружает подписчиков через `useSubscriptions`. Чистая логика (порядок комплиментов, имя и подпись получателя, проверка имени) лежит в `model.ts` своих фич и покрыта юнит-тестами; страницы покрыты тестами Testing Library с замоканным `authedApi`.

**Tech Stack:** React 19, TypeScript 5 (strict, `noUncheckedIndexedAccess`, `noUnusedLocals`), React Router 7, @tanstack/react-query 5, CSS Modules, Vitest 3, @testing-library/react 16, @testing-library/user-event 14, MSW 2.

**Spec:** `docs/superpowers/specs/2026-09-26-send-from-compliments-design.md`

## Global Constraints

- Бэкенд (`C:\pet\pulse-app\PulseApp.Backend`) не меняем. Фронт пишется под контракт из спека, даже если бэкенд его ещё не выполняет.
- Отправка одного комплимента: `POST /api/compliment/push/to/{subscriptionId}?complimentId={id}`.
- Код приглашения: `POST /api/code/create`, тело `{ "name": string }`, ответ — код строкой (JSON-строка или `text/plain`).
- `GET /api/subscription` → `[{ id, name, userAgent, createdAt, isActive }]`; `name` может отсутствовать, быть `null` или пробелами.
- Имя получателя: обязательное, пробелы по краям обрезаются, не длиннее 100 символов по кодовым точкам (`charCount`).
- В окне отправки отправленные комплименты (`isBeenPushed: true`): радиокнопка `disabled`, строка приглушена, метка «Отправлен», стоят после неотправленных; внутри группы новые сверху.
- Подпись получателя: «Имя · Устройство» (`parseUserAgent`), без имени — только устройство.
- Тексты интерфейса дословно: «Имя получателя», «Введите имя», «Не больше 100 символов», «Отправить», «Отправить комплимент», «Получатель», «Выберите получателя», «Уведомление придёт сразу.», «Нет активных подписчиков», «Создать ссылку», «Пока нет комплиментов», «Все комплименты уже отправлены. Чтобы отправить повторно, верните комплимент в очередь.», «Отправлен», «Комплимент отправлен», «Отправляем…», «Имя», «—».
- Без новых зависимостей и UI-библиотек; стили — CSS Modules и токены из `src/index.css`.
- Работа в ветке `feature/send-from-compliments` от `dev`. Коммиты на русском, с трейлером `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Команды: один файл тестов — `npx vitest run <путь>`; типы — `npx tsc --noEmit`; линтер — `npm run lint`; всё — `npm test`, `npm run build`.

## Review Focus

1. **Получателя отключили после неудачной отправки** (push-сервис ответил 410, бэкенд отключил подписку и вернул ошибку): выбор получателя сбрасывается на «Выберите получателя» и не перескакивает на единственного оставшегося — иначе повторное «Отправить» уйдёт другому человеку. Тест — Task 3.
2. **Бэкенд ещё не отдаёт `name` или отдаёт `null`/пробелы у старых подписок**: в таблице «—», в окне — только устройство, ничего не падает. Тесты — Task 2 (`subscriberName` с `undefined`/`null`/пробелами), Task 4.
3. **Имя из эмодзи**: 100 эмодзи — можно, 101 — ошибка; строка из одних пробелов — «Введите имя». Тест — Task 1.
4. **Не загрузились подписчики в окне отправки** (нет сети): в окне ошибка и «Повторить», повтор перезапрашивает именно подписчиков. Тест — Task 3.
5. **Все комплименты уже отправлены**: подсказка про возврат в очередь, ни один комплимент не выбрать, «Отправить» недоступна. Тест — Task 3.

---

## Карта файлов

| Файл | Ответственность | Задача |
|---|---|---|
| `src/shared/api/authedApi.ts` (+ `.test.ts`) | Адрес отправки (уже в рабочей копии), `createInviteCode(name)` | 1 |
| `src/features/invite/model.ts` (+ `.test.ts`) — новый | `NAME_MAX`, `validateName` | 1 |
| `src/features/invite/InvitePage.tsx`, `.module.css` (+ `.test.tsx`) | Поле «Имя получателя» | 1 |
| `src/shared/api/types.ts` | `name?: string \| null` в `MySubscriptionDto` | 2 |
| `src/features/subscribers/model.ts` (+ `.test.ts`) | `subscriberName`, `recipientLabel` | 2 |
| `src/features/compliments/model.ts` (+ `.test.ts`) | `sortForSending` | 2 |
| `src/shared/ui/Field.tsx` | `Select` в стиле `TextInput` | 3 |
| `src/features/compliments/SendComplimentDialog.tsx`, `.module.css` — перенос из `subscribers/` | Окно: получатель + комплимент | 3 |
| `src/features/compliments/queries.ts` | `useSendCompliment` (перенос) | 3 |
| `src/features/compliments/ComplimentsPage.tsx` (+ `.test.tsx`) | Кнопка «Отправить» и окно | 3 |
| `src/features/subscribers/queries.ts` | Убрать `useSendCompliment` | 3 |
| `src/features/subscribers/SubscribersPage.tsx` (+ `.test.tsx`) | Убрать отправку (3), колонка «Имя» (4) | 3, 4 |
| `src/features/subscribers/SubscribersPage.module.css` | Удалить (остаётся без использования) | 3 |

---

### Task 1: Код приглашения с именем получателя

**Files:**
- Modify: `src/shared/api/authedApi.ts:76-82`
- Test: `src/shared/api/authedApi.test.ts:95-110`
- Create: `src/features/invite/model.ts`
- Test: `src/features/invite/model.test.ts`
- Modify: `src/features/invite/InvitePage.tsx`
- Modify: `src/features/invite/InvitePage.module.css`
- Test: `src/features/invite/InvitePage.test.tsx`

**Interfaces:**
- Consumes: `charCount(value: string): number` из `src/features/compliments/model.ts` (уже есть).
- Produces: `authedApi.createInviteCode(name: string): Promise<string>`; `NAME_MAX = 100`; `validateName(name: string): string | undefined` (сама обрезает пробелы).

- [ ] **Step 1: Ветка и коммит уже сделанной правки адреса отправки**

В рабочей копии уже лежит правка `sendCompliment` → `/api/compliment/push/to/...` (файлы `authedApi.ts` и `authedApi.test.ts`). Она уходит отдельным коммитом до остальной работы.

```bash
git switch -c feature/send-from-compliments
git diff --stat
```
Expected: изменены только `src/shared/api/authedApi.test.ts` и `src/shared/api/authedApi.ts`, в диффе — только замена `/api/subscription/push/to/` на `/api/compliment/push/to/`.

```bash
npx vitest run src/shared/api/authedApi.test.ts
```
Expected: PASS.

```bash
git add src/shared/api/authedApi.ts src/shared/api/authedApi.test.ts
git commit -F - <<'EOF'
Отправка одного комплимента: новый адрес /api/compliment/push/to

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 2: Падающие тесты API**

В `src/shared/api/authedApi.test.ts` замените три теста `createInviteCode` (строки 95–110) на:

```ts
  it('createInviteCode шлёт имя в POST /api/code/create и понимает JSON-строку', async () => {
    let seen: { path: string; body: unknown } | null = null;
    server.use(
      http.post('*/api/code/create', async ({ request }) => {
        seen = { path: new URL(request.url).pathname, body: await request.json() };
        return HttpResponse.json('3f2b-code');
      }),
    );

    await expect(authedApi.createInviteCode('Маша')).resolves.toBe('3f2b-code');
    expect(seen).toEqual({ path: '/api/code/create', body: { name: 'Маша' } });
  });

  it('createInviteCode понимает text/plain', async () => {
    server.use(http.post('*/api/code/create', () => HttpResponse.text(' 3f2b-code\n')));
    await expect(authedApi.createInviteCode('Маша')).resolves.toBe('3f2b-code');
  });

  it('createInviteCode без кода — ошибка', async () => {
    server.use(http.post('*/api/code/create', () => HttpResponse.text('')));
    await expect(authedApi.createInviteCode('Маша')).rejects.toMatchObject({
      message: 'Сервер не вернул код приглашения',
    });
  });
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `npx vitest run src/shared/api/authedApi.test.ts`
Expected: FAIL в трёх тестах `createInviteCode` — запрос уходит на старый `/api/subscription/create`, обработчика для него нет.

- [ ] **Step 4: Реализация API**

В `src/shared/api/authedApi.ts` замените `createInviteCode`:

```ts
  async createInviteCode(name: string): Promise<string> {
    const code = await authedRequest<unknown>('/api/code/create', { method: 'POST', body: { name } });
    if (typeof code !== 'string' || !code.trim()) {
      throw new ApiError(500, 'Сервер не вернул код приглашения');
    }
    return code.trim();
  },
```

Run: `npx vitest run src/shared/api/authedApi.test.ts`
Expected: PASS.

- [ ] **Step 5: Падающий тест проверки имени**

Создайте `src/features/invite/model.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NAME_MAX, validateName } from './model';

describe('validateName', () => {
  it('пустое имя и одни пробелы — ошибка', () => {
    expect(validateName('')).toBe('Введите имя');
    expect(validateName('   ')).toBe('Введите имя');
  });

  it('пробелы по краям не считаются', () => {
    expect(validateName(`  ${'a'.repeat(NAME_MAX)}  `)).toBeUndefined();
  });

  it('100 символов — можно, 101 — ошибка', () => {
    expect(validateName('a'.repeat(100))).toBeUndefined();
    expect(validateName('a'.repeat(101))).toBe('Не больше 100 символов');
  });

  // Review Focus 3
  it('эмодзи — один символ: 100 можно, 101 — ошибка', () => {
    expect(validateName('😀'.repeat(100))).toBeUndefined();
    expect(validateName('😀'.repeat(101))).toBe('Не больше 100 символов');
  });
});
```

Run: `npx vitest run src/features/invite/model.test.ts`
Expected: FAIL — `Failed to resolve import "./model"`.

- [ ] **Step 6: Реализация проверки имени**

Создайте `src/features/invite/model.ts`:

```ts
import { charCount } from '../compliments/model';

export const NAME_MAX = 100;

/**
 * Ошибка для имени получателя или undefined, если имя подходит. Пробелы по краям не учитываются.
 */
export function validateName(name: string): string | undefined {
  const value = name.trim();
  if (!value) {
    return 'Введите имя';
  }
  if (charCount(value) > NAME_MAX) {
    return `Не больше ${NAME_MAX} символов`;
  }
  return undefined;
}
```

Run: `npx vitest run src/features/invite/model.test.ts`
Expected: PASS.

- [ ] **Step 7: Падающие тесты страницы «Ссылка»**

В `src/features/invite/InvitePage.test.tsx`:

0. В `vi.mock(...)` добавьте в объект `authedApi` строку `sendCompliment: vi.fn(),` — моки API во всех тестах страниц одинаковые.

1. Замените хелпер `createLink`:

```ts
async function createLink(name = 'Маша') {
  api.createInviteCode.mockResolvedValue(CODE);
  renderWithProviders(<InvitePage />);
  fireEvent.change(screen.getByLabelText('Имя получателя'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));
  return screen.findByLabelText('Ваша ссылка');
}
```

2. В тесте `'ошибка API — тост'` перед кликом по «Создать ссылку» добавьте ввод имени:

```ts
    fireEvent.change(screen.getByLabelText('Имя получателя'), { target: { value: 'Маша' } });
```

3. Добавьте в конец `describe('InvitePage', ...)`:

```ts
  it('отправляет имя без пробелов по краям', async () => {
    await createLink('  Маша  ');
    expect(api.createInviteCode).toHaveBeenCalledWith('Маша');
  });

  it('без имени ссылку не создаёт', async () => {
    renderWithProviders(<InvitePage />);

    fireEvent.change(screen.getByLabelText('Имя получателя'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));

    expect(await screen.findByText('Введите имя')).toBeInTheDocument();
    expect(api.createInviteCode).not.toHaveBeenCalled();
  });

  it('слишком длинное имя не отправляет', async () => {
    renderWithProviders(<InvitePage />);

    fireEvent.change(screen.getByLabelText('Имя получателя'), { target: { value: 'a'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать ссылку' }));

    expect(await screen.findByText('Не больше 100 символов')).toBeInTheDocument();
    expect(screen.getByText('101/100')).toBeInTheDocument();
    expect(api.createInviteCode).not.toHaveBeenCalled();
  });
```

Run: `npx vitest run src/features/invite/InvitePage.test.tsx`
Expected: FAIL — `Unable to find a label with the text of: Имя получателя`.

- [ ] **Step 8: Реализация страницы «Ссылка»**

Замените `src/features/invite/InvitePage.tsx` целиком:

```tsx
import { useMutation } from '@tanstack/react-query';
import { useId, useRef, useState, type FormEvent } from 'react';
import { authedApi } from '../../shared/api/authedApi';
import { describeError } from '../../shared/api/http';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Field, TextInput } from '../../shared/ui/Field';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useToast } from '../../shared/ui/toastContext';
import { charCount } from '../compliments/model';
import { buildInviteUrl } from './buildInviteUrl';
import styles from './InvitePage.module.css';
import { NAME_MAX, validateName } from './model';

export default function InvitePage() {
  const toast = useToast();
  const nameId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [url, setUrl] = useState<string | null>(null);
  const canShare = typeof navigator.share === 'function';

  const create = useMutation({
    mutationFn: (recipientName: string) => authedApi.createInviteCode(recipientName),
    onSuccess: (code) => setUrl(buildInviteUrl(window.location.origin, code)),
    onError: (error) => {
      const { message, traceId } = describeError(error);
      toast.show(message, { type: 'error', traceId });
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = name.trim();
    const error = validateName(cleaned);
    setNameError(error);
    if (!error) {
      create.mutate(cleaned);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.show('Ссылка скопирована', { type: 'success' });
    } catch {
      fieldRef.current?.focus();
      fieldRef.current?.select();
      toast.show('Не удалось скопировать автоматически — ссылка выделена, скопируйте её вручную', { type: 'info' });
    }
  };

  const share = async () => {
    if (!url) return;
    try {
      await navigator.share({ title: 'Pulse', text: 'Подпишись на мои комплименты', url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.show('Не удалось поделиться ссылкой', { type: 'error' });
      }
    }
  };

  return (
    <section className={styles.page}>
      <PageHeader title="Ссылка-приглашение" />
      <p className={styles.lead}>
        Отправьте ссылку человеку, которому хотите дарить комплименты. Он откроет её и подпишется на уведомления —
        регистрироваться ему не нужно.
      </p>

      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="Имя получателя" htmlFor={nameId} error={nameError} count={charCount(name)} max={NAME_MAX}>
          <TextInput id={nameId} value={name} autoComplete="off" onChange={(event) => setName(event.target.value)} />
        </Field>
        <div>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Создаём…' : url ? 'Создать новую ссылку' : 'Создать ссылку'}
          </Button>
        </div>
      </form>

      {url && (
        <Card className={styles.result}>
          <label htmlFor="invite-url" className={styles.label}>
            Ваша ссылка
          </label>
          <textarea id="invite-url" ref={fieldRef} className={styles.url} readOnly rows={2} value={url} />
          <div className={styles.actions}>
            <Button onClick={() => void copy()}>Скопировать</Button>
            {canShare && (
              <Button variant="secondary" onClick={() => void share()}>
                Поделиться
              </Button>
            )}
          </div>
        </Card>
      )}

      <p className={styles.hint}>
        Ссылка одноразовая и действует 24 часа. Для каждого человека и устройства создайте новую. Ссылка не
        сохраняется: если уйти со страницы, создайте новую.
      </p>
    </section>
  );
}
```

В `src/features/invite/InvitePage.module.css` после `.lead { ... }` добавьте:

```css
.form {
  max-width: 420px;
}
```

- [ ] **Step 9: Тесты, типы, линтер**

Run: `npx vitest run src/features/invite src/shared/api/authedApi.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 10: Commit**

```bash
git add src/shared/api/authedApi.ts src/shared/api/authedApi.test.ts src/features/invite
git commit -F - <<'EOF'
Ссылка-приглашение с именем получателя: POST /api/code/create

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Имя подписчика и порядок комплиментов для отправки (модель)

**Files:**
- Modify: `src/shared/api/types.ts:20-25`
- Modify: `src/features/subscribers/model.ts`
- Test: `src/features/subscribers/model.test.ts`
- Modify: `src/features/compliments/model.ts`
- Test: `src/features/compliments/model.test.ts`

**Interfaces:**
- Consumes: `parseUserAgent(userAgent: string | null): string`, `sortByNewest(compliments: ComplimentDto[]): ComplimentDto[]` (уже есть).
- Produces:
  - `MySubscriptionDto.name?: string | null`
  - `subscriberName(subscription: MySubscriptionDto): string | null` — имя без пробелов по краям или `null`.
  - `recipientLabel(subscription: MySubscriptionDto): string` — «Маша · iPhone · Safari» или только устройство.
  - `sortForSending(compliments: ComplimentDto[]): ComplimentDto[]` — неотправленные, затем отправленные, внутри новые сверху; исходный массив не меняется.

- [ ] **Step 1: Поле имени в типе**

В `src/shared/api/types.ts` замените `MySubscriptionDto`:

```ts
export type MySubscriptionDto = {
  id: string;
  /** Имя из ссылки-приглашения. У старых подписок его нет, бэкенд может ещё не отдавать поле */
  name?: string | null;
  userAgent: string | null;
  createdAt: string;
  isActive: boolean;
};
```

- [ ] **Step 2: Падающие тесты имени и подписи**

В `src/features/subscribers/model.test.ts` замените импорт модели на:

```ts
import { parseUserAgent, recipientLabel, sortSubscriptions, subscriberName } from './model';
```

и добавьте в конец файла:

```ts
const base: MySubscriptionDto = { id: 's1', userAgent: null, createdAt: '2026-09-10T10:00:00+00:00', isActive: true };
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// Review Focus 2
describe('subscriberName', () => {
  it.each([
    ['  Маша ', 'Маша'],
    ['   ', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('%j → %j', (name, expected) => {
    expect(subscriberName({ ...base, name })).toBe(expected);
  });
});

describe('recipientLabel', () => {
  it('имя и устройство', () => {
    expect(recipientLabel({ ...base, name: ' Маша ', userAgent: IPHONE_SAFARI })).toBe('Маша · iPhone · Safari');
  });

  it('без имени — только устройство', () => {
    expect(recipientLabel({ ...base, name: '   ', userAgent: IPHONE_SAFARI })).toBe('iPhone · Safari');
    expect(recipientLabel({ ...base, userAgent: null })).toBe('Неизвестное устройство');
  });
});
```

Run: `npx vitest run src/features/subscribers/model.test.ts`
Expected: FAIL — `subscriberName is not a function`.

- [ ] **Step 3: Реализация имени и подписи**

В конец `src/features/subscribers/model.ts` добавьте:

```ts
/**
 * Имя подписчика без пробелов по краям или null, если имени нет.
 */
export function subscriberName(subscription: MySubscriptionDto): string | null {
  return subscription.name?.trim() || null;
}

/**
 * Подпись получателя в окне отправки: «Маша · iPhone · Safari», без имени — только устройство.
 */
export function recipientLabel(subscription: MySubscriptionDto): string {
  const device = parseUserAgent(subscription.userAgent);
  const name = subscriberName(subscription);
  return name ? `${name} · ${device}` : device;
}
```

Run: `npx vitest run src/features/subscribers/model.test.ts`
Expected: PASS.

- [ ] **Step 4: Падающий тест порядка комплиментов**

В `src/features/compliments/model.test.ts` замените импорт модели на:

```ts
import { charCount, hasErrors, sortByNewest, sortForSending, validateCompliment } from './model';
```

и добавьте в конец файла:

```ts
describe('sortForSending', () => {
  it('сначала неотправленные, затем отправленные, внутри — новые сверху; исходный массив не меняется', () => {
    const list = [
      { id: 'sent-new', isBeenPushed: true, createdAt: '2026-09-20T10:00:00+00:00' },
      { id: 'queued-old', isBeenPushed: false, createdAt: '2026-09-01T10:00:00+00:00' },
      { id: 'sent-old', isBeenPushed: true, createdAt: '2026-09-02T10:00:00+00:00' },
      { id: 'queued-new', isBeenPushed: false, createdAt: '2026-09-10T10:00:00+00:00' },
    ] as ComplimentDto[];

    expect(sortForSending(list).map((c) => c.id)).toEqual(['queued-new', 'queued-old', 'sent-new', 'sent-old']);
    expect(list.map((c) => c.id)).toEqual(['sent-new', 'queued-old', 'sent-old', 'queued-new']);
  });
});
```

Run: `npx vitest run src/features/compliments/model.test.ts`
Expected: FAIL — `sortForSending is not a function`.

- [ ] **Step 5: Реализация порядка**

В конец `src/features/compliments/model.ts` добавьте:

```ts
/**
 * Порядок в окне отправки: сначала неотправленные, затем отправленные; внутри группы новые сверху.
 */
export function sortForSending(compliments: ComplimentDto[]): ComplimentDto[] {
  const newest = sortByNewest(compliments);
  return [...newest.filter((c) => !c.isBeenPushed), ...newest.filter((c) => c.isBeenPushed)];
}
```

Run: `npx vitest run src/features/compliments/model.test.ts src/features/subscribers/model.test.ts`
Expected: PASS.

- [ ] **Step 6: Типы и линтер**

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок.

- [ ] **Step 7: Commit**

```bash
git add src/shared/api/types.ts src/features/subscribers/model.ts src/features/subscribers/model.test.ts src/features/compliments/model.ts src/features/compliments/model.test.ts
git commit -F - <<'EOF'
Модель: имя подписчика, подпись получателя, порядок комплиментов для отправки

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Отправка одного комплимента со страницы «Комплименты»

**Files:**
- Modify: `src/shared/ui/Field.tsx`
- Move: `src/features/subscribers/SendComplimentDialog.tsx` → `src/features/compliments/SendComplimentDialog.tsx`
- Move: `src/features/subscribers/SendComplimentDialog.module.css` → `src/features/compliments/SendComplimentDialog.module.css`
- Modify: `src/features/compliments/queries.ts`
- Modify: `src/features/compliments/ComplimentsPage.tsx`
- Test: `src/features/compliments/ComplimentsPage.test.tsx`
- Modify: `src/features/subscribers/queries.ts`
- Modify: `src/features/subscribers/SubscribersPage.tsx`
- Delete: `src/features/subscribers/SubscribersPage.module.css`
- Test: `src/features/subscribers/SubscribersPage.test.tsx`

**Interfaces:**
- Consumes: `recipientLabel`, `sortSubscriptions` из `src/features/subscribers/model.ts`; `sortForSending` из `src/features/compliments/model.ts` (Task 2); `useSubscriptions`, `subscriptionsKey` из `src/features/subscribers/queries.ts`; `authedApi.sendCompliment(subscriptionId: string, complimentId: string): Promise<null>`.
- Produces:
  - `Select` из `src/shared/ui/Field.tsx` (пропсы `SelectHTMLAttributes<HTMLSelectElement>`).
  - `useSendCompliment()` в `src/features/compliments/queries.ts`, переменные `SendComplimentVariables = { subscriptionId: string; complimentId: string }`.
  - `SendComplimentDialog({ pending, onSend(subscriptionId, complimentId), onClose })` в `src/features/compliments/`.

- [ ] **Step 1: Падающие тесты страницы «Комплименты»**

В `src/features/compliments/ComplimentsPage.test.tsx`:

1. Замените импорт типов на:

```ts
import type { ComplimentDto, MySubscriptionDto } from '../../shared/api/types';
```

2. В `vi.mock(...)` добавьте в объект `authedApi` строку `sendCompliment: vi.fn(),`.

3. После функции `compliment(...)` добавьте:

```ts
const IPHONE_APP =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

function subscription(overrides: Partial<MySubscriptionDto> = {}): MySubscriptionDto {
  return {
    id: 's1',
    name: 'Маша',
    userAgent: IPHONE_APP,
    createdAt: '2026-09-10T10:00:00+00:00',
    isActive: true,
    ...overrides,
  };
}

async function openSendDialog(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: /^Комплименты · / });
  await user.click(screen.getByRole('button', { name: 'Отправить' }));
  return screen.getByRole('dialog', { name: 'Отправить комплимент' });
}
```

4. В конец файла добавьте новый блок:

```ts
describe('ComplimentsPage: отправка одного комплимента', () => {
  it('отправляет выбранный комплимент выбранному получателю и перечитывает списки', async () => {
    api.getMySubscriptions.mockResolvedValue([
      subscription({ id: 'sub-masha', name: 'Маша', createdAt: '2026-09-10T10:00:00+00:00' }),
      subscription({ id: 'sub-petya', name: 'Петя', createdAt: '2026-09-01T10:00:00+00:00' }),
    ]);
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'c-old', title: 'Старый', createdAt: '2026-09-01T10:00:00+00:00' }),
      compliment({ id: 'c-new', title: 'Новый', createdAt: '2026-09-10T10:00:00+00:00' }),
    ]);
    api.sendCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const recipient = await within(dialog).findByLabelText('Получатель');
    expect(recipient).toHaveValue('');
    expect(within(recipient).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Выберите получателя',
      'Маша · iPhone · веб-приложение',
      'Петя · iPhone · веб-приложение',
    ]);
    const radios = await within(dialog).findAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['c-new', 'c-old']);
    const send = within(dialog).getByRole('button', { name: 'Отправить' });
    expect(send).toBeDisabled();

    await user.selectOptions(recipient, 'sub-petya');
    await user.click(within(dialog).getByRole('radio', { name: /Старый/ }));
    const complimentsBefore = api.getCompliments.mock.calls.length;
    const subscriptionsBefore = api.getMySubscriptions.mock.calls.length;
    await user.click(send);

    await waitFor(() => expect(api.sendCompliment).toHaveBeenCalledWith('sub-petya', 'c-old'));
    expect(await screen.findByText('Комплимент отправлен')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.getCompliments.mock.calls.length).toBeGreaterThan(complimentsBefore);
    expect(api.getMySubscriptions.mock.calls.length).toBeGreaterThan(subscriptionsBefore);
  });

  it('отправленные комплименты недоступны и стоят в конце', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([
      compliment({ id: 'sent', title: 'Обед', isBeenPushed: true, createdAt: '2026-09-20T10:00:00+00:00' }),
      compliment({ id: 'queued', title: 'Утро', createdAt: '2026-09-01T10:00:00+00:00' }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const radios = await within(dialog).findAllByRole('radio');

    expect(radios.map((radio) => radio.getAttribute('value'))).toEqual(['queued', 'sent']);
    expect(within(dialog).getByRole('radio', { name: /Обед/ })).toBeDisabled();
    expect(within(dialog).getByRole('radio', { name: /Утро/ })).toBeEnabled();
    expect(within(dialog).getByText('Отправлен')).toBeInTheDocument();
  });

  it('единственный активный получатель выбран сразу', async () => {
    api.getMySubscriptions.mockResolvedValue([
      subscription({ id: 'sub-1', name: 'Маша' }),
      subscription({ id: 'sub-off', name: 'Петя', isActive: false }),
    ]);
    api.getCompliments.mockResolvedValue([compliment({ id: 'c1' })]);
    api.sendCompliment.mockResolvedValue(null);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    const recipient = await within(dialog).findByLabelText('Получатель');
    expect(recipient).toHaveValue('sub-1');
    expect(within(recipient).getAllByRole('option')).toHaveLength(1);

    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    await waitFor(() => expect(api.sendCompliment).toHaveBeenCalledWith('sub-1', 'c1'));
  });

  it('без комплиментов — пустое состояние без ссылки', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Пока нет комплиментов')).toBeInTheDocument();
    expect(within(dialog).queryByRole('link')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('без активных подписчиков предлагает создать ссылку', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription({ isActive: false })]);
    api.getCompliments.mockResolvedValue([compliment()]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Нет активных подписчиков')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Создать ссылку' })).toHaveAttribute('href', '/app/invite');
    expect(within(dialog).queryByRole('radio')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  // Review Focus 5
  it('все комплименты отправлены — подсказка, отправить нельзя', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([compliment({ isBeenPushed: true })]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(
      await within(dialog).findByText(
        'Все комплименты уже отправлены. Чтобы отправить повторно, верните комплимент в очередь.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /Утро/ })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('ошибка отправки — тост с кодом, окно остаётся открытым', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);
    api.getCompliments.mockResolvedValue([compliment()]);
    api.sendCompliment.mockRejectedValue(new ApiError(400, 'Subscription not found or it is not active', 'trace-7'));
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText('Subscription not found or it is not active')).toBeInTheDocument();
    expect(screen.getByText('Код: trace-7')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Отправить комплимент' })).toBeInTheDocument();
  });

  // Review Focus 1
  it('получатель, отключённый после ошибки, пропадает, а выбор сбрасывается', async () => {
    api.getMySubscriptions
      .mockResolvedValueOnce([subscription({ id: 'sub-1', name: 'Маша' }), subscription({ id: 'sub-2', name: 'Петя' })])
      .mockResolvedValue([
        subscription({ id: 'sub-1', name: 'Маша', isActive: false }),
        subscription({ id: 'sub-2', name: 'Петя' }),
      ]);
    api.getCompliments.mockResolvedValue([compliment({ id: 'c1' })]);
    api.sendCompliment.mockRejectedValue(new ApiError(400, 'Subscription not found or it is not active', 't-2'));
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);
    await user.selectOptions(await within(dialog).findByLabelText('Получатель'), 'sub-1');
    await user.click(await within(dialog).findByRole('radio', { name: /Утро/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText('Subscription not found or it is not active')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).queryByRole('option', { name: /Маша/ })).not.toBeInTheDocument());
    expect(within(dialog).getByLabelText('Получатель')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  // Review Focus 4
  it('ошибка загрузки подписчиков — повтор', async () => {
    api.getMySubscriptions.mockRejectedValueOnce(new ApiError(0, 'x'));
    api.getMySubscriptions.mockResolvedValueOnce([subscription()]);
    api.getCompliments.mockResolvedValue([compliment()]);
    const user = userEvent.setup();
    renderWithProviders(<ComplimentsPage />);

    const dialog = await openSendDialog(user);

    expect(await within(dialog).findByText('Нет соединения с сервером')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Повторить' }));
    expect(await within(dialog).findByLabelText('Получатель')).toHaveValue('s1');
  });
});
```

- [ ] **Step 2: Тесты страницы «Подписчики» без отправки**

В `src/features/subscribers/SubscribersPage.test.tsx`:

1. Удалите тесты `'кнопка отправки есть только у активных подписок'`, `'отправляет выбранный комплимент подписчику и обновляет список'`, `'ошибка отправки — тост с кодом, окно остаётся открытым'`, `'без комплиментов предлагает их добавить'`.
2. Удалите функцию `compliment(...)`, импорт `userEvent`, `waitFor` из импорта `@testing-library/react` и `ComplimentDto` из импорта типов. Итоговые импорты:

```ts
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authedApi } from '../../shared/api/authedApi';
import { ApiError } from '../../shared/api/http';
import type { MySubscriptionDto } from '../../shared/api/types';
import { renderWithProviders } from '../../test/renderWithProviders';
import SubscribersPage from './SubscribersPage';
```

3. Добавьте в конец `describe('SubscribersPage', ...)`:

```ts
  it('отправки комплимента на странице нет', async () => {
    api.getMySubscriptions.mockResolvedValue([subscription()]);

    renderWithProviders(<SubscribersPage />);

    await screen.findByRole('heading', { name: 'Подписчики · 1' });
    expect(screen.queryByRole('button', { name: 'Отправить комплимент' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `npx vitest run src/features/compliments/ComplimentsPage.test.tsx src/features/subscribers/SubscribersPage.test.tsx`
Expected: FAIL — в новых тестах `Unable to find an accessible element with the role "button" and name "Отправить"`; в `SubscribersPage` — кнопка «Отправить комплимент» ещё есть.

- [ ] **Step 4: `Select` в полях формы**

В `src/shared/ui/Field.tsx` замените первую строку импорта на:

```ts
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
```

и добавьте в конец файла:

```tsx
export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={[styles.control, className].filter(Boolean).join(' ')} {...rest} />;
}
```

- [ ] **Step 5: Перенести мутацию отправки**

`src/features/subscribers/queries.ts` целиком:

```ts
import { useQuery } from '@tanstack/react-query';
import { authedApi } from '../../shared/api/authedApi';

export const subscriptionsKey = ['subscriptions'] as const;

export function useSubscriptions() {
  return useQuery({ queryKey: subscriptionsKey, queryFn: () => authedApi.getMySubscriptions() });
}
```

В `src/features/compliments/queries.ts` после строки `import { useToast } from '../../shared/ui/toastContext';` добавьте:

```ts
import { subscriptionsKey } from '../subscribers/queries';
```

и в конец файла:

```ts
export type SendComplimentVariables = {
  subscriptionId: string;
  complimentId: string;
};

/**
 * Отправка комплимента одному подписчику: тост и перечитывание списков.
 * Бэкенд ставит комплименту isBeenPushed, а при ответе push-сервиса 404/410 отключает подписку.
 */
export function useSendCompliment() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ subscriptionId, complimentId }: SendComplimentVariables) =>
      authedApi.sendCompliment(subscriptionId, complimentId),
    onSuccess: () => {
      toast.show('Комплимент отправлен', { type: 'success' });
    },
    onError: (error) => {
      const { message, traceId } = describeError(error);
      toast.show(message, { type: 'error', traceId });
    },
    // Ждём перечитывания: окно закроется, когда статусы в списках уже свежие
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: complimentsKey }),
        queryClient.invalidateQueries({ queryKey: subscriptionsKey }),
      ]),
  });
}
```

- [ ] **Step 6: Перенести и переделать окно отправки**

```bash
git mv src/features/subscribers/SendComplimentDialog.tsx src/features/compliments/SendComplimentDialog.tsx
git mv src/features/subscribers/SendComplimentDialog.module.css src/features/compliments/SendComplimentDialog.module.css
```

`src/features/compliments/SendComplimentDialog.tsx` целиком:

```tsx
import { useId, useMemo, useState } from 'react';
import { describeError } from '../../shared/api/http';
import type { MySubscriptionDto } from '../../shared/api/types';
import { Button } from '../../shared/ui/Button';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { Field, Select } from '../../shared/ui/Field';
import { LinkButton } from '../../shared/ui/LinkButton';
import { Modal } from '../../shared/ui/Modal';
import { Spinner } from '../../shared/ui/Spinner';
import table from '../../shared/ui/Table.module.css';
import { recipientLabel, sortSubscriptions } from '../subscribers/model';
import { useSubscriptions } from '../subscribers/queries';
import { sortForSending } from './model';
import { useCompliments } from './queries';
import styles from './SendComplimentDialog.module.css';

type SendComplimentDialogProps = {
  pending: boolean;
  onSend: (subscriptionId: string, complimentId: string) => void;
  onClose: () => void;
};

/**
 * Выбранный получатель. Пока автор ничего не выбирал, единственный активный подписчик выбирается сам.
 * Выбор автора действует, пока подписка активна: после ошибки отправки бэкенд может её отключить,
 * и тогда выбор сбрасывается, а не переходит к другому подписчику.
 */
function resolveRecipientId(picked: string | null, recipients: MySubscriptionDto[]): string {
  if (picked === null) {
    return recipients.length === 1 ? (recipients[0]?.id ?? '') : '';
  }
  return recipients.some((item) => item.id === picked) ? picked : '';
}

export function SendComplimentDialog({ pending, onSend, onClose }: SendComplimentDialogProps) {
  const recipientFieldId = useId();
  const groupName = useId();
  const subscriptionsQuery = useSubscriptions();
  const complimentsQuery = useCompliments();
  const recipients = useMemo(
    () => sortSubscriptions(subscriptionsQuery.data ?? []).filter((item) => item.isActive),
    [subscriptionsQuery.data],
  );
  const compliments = useMemo(() => sortForSending(complimentsQuery.data ?? []), [complimentsQuery.data]);
  const [pickedRecipientId, setPickedRecipientId] = useState<string | null>(null);
  const [pickedComplimentId, setPickedComplimentId] = useState<string | null>(null);

  const recipientId = resolveRecipientId(pickedRecipientId, recipients);
  const complimentId = compliments.some((item) => item.id === pickedComplimentId && !item.isBeenPushed)
    ? pickedComplimentId
    : null;
  const allSent = compliments.length > 0 && compliments.every((item) => item.isBeenPushed);
  const subscriptionsError = subscriptionsQuery.isError ? describeError(subscriptionsQuery.error) : null;
  const complimentsError = complimentsQuery.isError ? describeError(complimentsQuery.error) : null;

  return (
    <Modal
      title="Отправить комплимент"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            disabled={!recipientId || !complimentId || pending}
            onClick={() => recipientId && complimentId && onSend(recipientId, complimentId)}
          >
            {pending ? 'Отправляем…' : 'Отправить'}
          </Button>
        </>
      }
    >
      {subscriptionsQuery.isPending && <Spinner label="Загружаем подписчиков…" />}
      {subscriptionsError && (
        <ErrorState
          message={subscriptionsError.message}
          traceId={subscriptionsError.traceId}
          onRetry={() => void subscriptionsQuery.refetch()}
        />
      )}
      {subscriptionsQuery.isSuccess && recipients.length === 0 && (
        <EmptyState title="Нет активных подписчиков">
          <LinkButton to="/app/invite">Создать ссылку</LinkButton>
        </EmptyState>
      )}

      {recipients.length > 0 && (
        <>
          <Field label="Получатель" htmlFor={recipientFieldId} hint="Уведомление придёт сразу.">
            <Select
              id={recipientFieldId}
              value={recipientId}
              onChange={(event) => setPickedRecipientId(event.target.value)}
            >
              {(recipients.length > 1 || !recipientId) && <option value="">Выберите получателя</option>}
              {recipients.map((item) => (
                <option key={item.id} value={item.id}>
                  {recipientLabel(item)}
                </option>
              ))}
            </Select>
          </Field>

          {complimentsQuery.isPending && <Spinner label="Загружаем комплименты…" />}
          {complimentsError && (
            <ErrorState
              message={complimentsError.message}
              traceId={complimentsError.traceId}
              onRetry={() => void complimentsQuery.refetch()}
            />
          )}
          {complimentsQuery.isSuccess && compliments.length === 0 && <EmptyState title="Пока нет комплиментов" />}
          {allSent && (
            <p className={styles.hint}>
              Все комплименты уже отправлены. Чтобы отправить повторно, верните комплимент в очередь.
            </p>
          )}
          {compliments.length > 0 && (
            <div role="radiogroup" aria-label="Комплимент" className={styles.list}>
              {compliments.map((compliment) => (
                <label key={compliment.id} className={styles.option}>
                  <input
                    type="radio"
                    name={groupName}
                    value={compliment.id}
                    disabled={compliment.isBeenPushed}
                    checked={complimentId === compliment.id}
                    onChange={() => setPickedComplimentId(compliment.id)}
                  />
                  <span className={styles.content}>
                    <span className={styles.title}>{compliment.title}</span>
                    <span className={styles.text}>{compliment.text}</span>
                  </span>
                  {compliment.isBeenPushed && (
                    <span className={[table.badgeMuted, styles.badge].join(' ')}>Отправлен</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
```

В `src/features/compliments/SendComplimentDialog.module.css`:

1. Удалите правила `.recipient { ... }` и `.recipient strong { ... }` (строки 1–8).
2. Добавьте в начало файла:

```css
.hint {
  margin-bottom: 12px;
  color: var(--color-muted);
}
```

3. Добавьте после правила `.option:has(input:checked) { ... }`:

```css
.option:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.55;
}

.option:has(input:disabled):hover {
  background: none;
}
```

4. Добавьте в конец файла:

```css
.badge {
  flex-shrink: 0;
  margin-left: auto;
}
```

- [ ] **Step 7: Кнопка «Отправить» на странице «Комплименты»**

В `src/features/compliments/ComplimentsPage.tsx`:

1. Замените блок импорта из `./queries` (строки 14–20) на:

```ts
import {
  useCompliments,
  useCreateCompliment,
  useCreateCompliments,
  useDeleteCompliment,
  useSendCompliment,
  useUpdateCompliment,
} from './queries';
import { SendComplimentDialog } from './SendComplimentDialog';
```

2. Тип `Dialog` — добавьте вариант `| { kind: 'send' }`:

```ts
type Dialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'bulk' }
  | { kind: 'send' }
  | { kind: 'edit'; compliment: ComplimentDto }
  | { kind: 'delete'; compliment: ComplimentDto };
```

3. После `const deleteMutation = useDeleteCompliment();` добавьте:

```ts
  const sendMutation = useSendCompliment();
```

4. После функции `remove` добавьте:

```ts
  const send = (subscriptionId: string, complimentId: string) =>
    sendMutation.mutate({ subscriptionId, complimentId }, { onSuccess: close });
```

5. `actions` в `PageHeader`:

```tsx
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog({ kind: 'send' })}>
              Отправить
            </Button>
            <Button variant="secondary" onClick={() => setDialog({ kind: 'bulk' })}>
              Добавить списком
            </Button>
            <Button onClick={() => setDialog({ kind: 'create' })}>Добавить</Button>
          </>
        }
```

6. Перед блоком `{dialog.kind === 'edit' && (` добавьте:

```tsx
      {dialog.kind === 'send' && (
        <SendComplimentDialog pending={sendMutation.isPending} onSend={send} onClose={close} />
      )}
```

- [ ] **Step 8: Убрать отправку со страницы «Подписчики»**

```bash
git rm src/features/subscribers/SubscribersPage.module.css
```

`src/features/subscribers/SubscribersPage.tsx` целиком:

```tsx
import { useMemo } from 'react';
import { describeError } from '../../shared/api/http';
import { formatDateTime } from '../../shared/lib/format';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LinkButton } from '../../shared/ui/LinkButton';
import { PageHeader } from '../../shared/ui/PageHeader';
import { Spinner } from '../../shared/ui/Spinner';
import table from '../../shared/ui/Table.module.css';
import { parseUserAgent, sortSubscriptions } from './model';
import { useSubscriptions } from './queries';

export default function SubscribersPage() {
  const query = useSubscriptions();
  const items = useMemo(() => sortSubscriptions(query.data ?? []), [query.data]);
  const loadError = query.isError ? describeError(query.error) : null;

  return (
    <section>
      <PageHeader title={query.data ? `Подписчики · ${items.length}` : 'Подписчики'} />

      {query.isPending && <Spinner label="Загружаем подписчиков…" />}
      {loadError && (
        <ErrorState message={loadError.message} traceId={loadError.traceId} onRetry={() => void query.refetch()} />
      )}
      {query.isSuccess && items.length === 0 && (
        <EmptyState title="Пока никто не подписан">
          <LinkButton to="/app/invite">Создать ссылку</LinkButton>
        </EmptyState>
      )}
      {items.length > 0 && (
        <table className={table.table}>
          <thead>
            <tr>
              <th>Устройство</th>
              <th>Подписан</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Устройство">
                  <span title={item.userAgent ?? undefined}>{parseUserAgent(item.userAgent)}</span>
                </td>
                <td data-label="Подписан">{formatDateTime(item.createdAt)}</td>
                <td data-label="Статус">
                  <span className={item.isActive ? table.badgeSuccess : table.badgeMuted}>
                    {item.isActive ? 'Активна' : 'Отключена'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
```

- [ ] **Step 9: Тесты, типы, линтер**

Run: `npx vitest run src/features/compliments src/features/subscribers`
Expected: PASS.

Run: `npx tsc --noEmit && npm run lint`
Expected: без ошибок. `grep -rn "SubscribersPage.module.css\|subscribers/SendComplimentDialog" src` ничего не находит.

- [ ] **Step 10: Commit**

```bash
git add -A src/shared/ui/Field.tsx src/features/compliments src/features/subscribers
git commit -F - <<'EOF'
Отправка одного комплимента переехала на страницу «Комплименты»

Выбор получателя в окне, отправленные комплименты недоступны.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Колонка «Имя» на странице «Подписчики» и итоговая проверка

**Files:**
- Modify: `src/features/subscribers/SubscribersPage.tsx`
- Test: `src/features/subscribers/SubscribersPage.test.tsx`

**Interfaces:**
- Consumes: `subscriberName(subscription: MySubscriptionDto): string | null` из `src/features/subscribers/model.ts` (Task 2).
- Produces: ничего нового.

- [ ] **Step 1: Падающий тест**

В `src/features/subscribers/SubscribersPage.test.tsx` замените тест `'показывает подписчиков: активные сверху'`:

```ts
  // Review Focus 2
  it('показывает подписчиков: активные сверху, имя или прочерк', async () => {
    api.getMySubscriptions.mockResolvedValue([
      { id: 's1', name: null, userAgent: null, createdAt: '2026-09-20T10:00:00+00:00', isActive: false },
      { id: 's2', name: '  Маша ', userAgent: IPHONE_APP, createdAt: '2026-09-10T10:00:00+00:00', isActive: true },
    ]);

    renderWithProviders(<SubscribersPage />);

    expect(await screen.findByRole('heading', { name: 'Подписчики · 2' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Имя',
      'Устройство',
      'Подписан',
      'Статус',
    ]);
    const rows = screen.getAllByRole('row');
    expect(within(rows[1]!).getByText('Маша')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('iPhone · веб-приложение')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Активна')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('—')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Неизвестное устройство')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Отключена')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('iPhone · веб-приложение')).toHaveAttribute('title', IPHONE_APP);
  });
```

Run: `npx vitest run src/features/subscribers/SubscribersPage.test.tsx`
Expected: FAIL — заголовки колонок `['Устройство', 'Подписан', 'Статус']`.

- [ ] **Step 2: Колонка «Имя»**

В `src/features/subscribers/SubscribersPage.tsx`:

1. Импорт модели:

```ts
import { parseUserAgent, sortSubscriptions, subscriberName } from './model';
```

2. Первой ячейкой в `<thead><tr>` добавьте `<th>Имя</th>`.
3. Первой ячейкой в строке `<tr key={item.id}>` добавьте:

```tsx
                <td data-label="Имя">{subscriberName(item) ?? '—'}</td>
```

Run: `npx vitest run src/features/subscribers/SubscribersPage.test.tsx`
Expected: PASS.

- [ ] **Step 3: Итоговая проверка**

Run: `npm test`
Expected: все тесты PASS, 0 failed.

Run: `npm run lint`
Expected: без ошибок.

Run: `npm run build`
Expected: `tsc --noEmit` и `vite build` без ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/features/subscribers/SubscribersPage.tsx src/features/subscribers/SubscribersPage.test.tsx
git commit -F - <<'EOF'
Подписчики: колонка «Имя»

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

## После плана

Ручная проверка в браузере возможна только после исправления бэкенда (раздел 7 спека): сейчас `POST /api/code/create` падает с 500, а `GET /api/subscription` не отдаёт `name`. До этого страница «Ссылка» показывает тост «Ошибка сервера. Попробуйте позже», а в списках вместо имён — «—» и устройство.
