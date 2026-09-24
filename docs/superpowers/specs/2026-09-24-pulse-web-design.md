# Pulse Web — новый фронт: подписка по ссылке и кабинет автора

> Спецификация, 24.09.2026. Репозиторий: `PulseApp.Frontend`.
> Требования к бэкенду и инфраструктуре вынесены в отдельный документ: `C:\pet\pulse-app\backend-notes-web-v2.md`.

## 1. Цель

Один фронт вместо двух (PulseApp.Frontend и PulseApp.Admin):

1. **Получатель** открывает ссылку-приглашение и подписывается на push-уведомления **без регистрации и входа**, только по коду из ссылки.
2. **Автор** регистрируется, добавляет комплименты, создаёт ссылку-приглашение и видит своих подписчиков.

PulseApp.Admin больше не нужен и будет удалён. Из него переносится работа с комплиментами (создание, редактирование, удаление, массовое добавление) и просмотр подписок. Разделов «ручная рассылка», «сброс пула», «здоровье» и роли admin в новом фронте нет.

## 2. Принятые решения

| Вопрос | Решение |
|---|---|
| Регистрация получателя | Не нужна. Подписка только по `InviteCode` через существующий анонимный `POST /api/subscribe` |
| Модель данных | Общий пул комплиментов на автора. Ссылки безымянные, одноразовые, живут 24 ч (как в текущем бэкенде) |
| Язык | TypeScript |
| Архитектура | Одно SPA: React 19 + Vite + React Router, lazy-чанки по разделам |
| Вход автора | Keycloak, Authorization Code + PKCE, `oidc-client-ts` + `react-oidc-context`. Логин и регистрация на страницах Keycloak |
| Серверное состояние | TanStack Query (только в кабинете) |
| Стили | CSS Modules, без UI-библиотеки. Кабинет автора — сначала десктоп. Лендинг и страница подписки — сначала телефон (их открывают получатели) |
| Тесты | Vitest + Testing Library + MSW |

## 3. Вне рамок

Расписание, шаблоны, ИИ-генерация, реакции получателя, статистика, оплата, имя автора на странице подписки, список созданных ссылок, QR-код, раздел администратора, тёмная тема, офлайн-режим.

## 4. Критерий готовности

На проде проходит полная цепочка:

1. Автор регистрируется в Keycloak и попадает в кабинет.
2. Добавляет несколько комплиментов (по одному и списком), редактирует и удаляет их.
3. Создаёт ссылку и отправляет её через «Поделиться».
4. Получатель открывает ссылку на iPhone, добавляет сайт на экран «Домой», подписывается без входа.
5. Получателю приходит push с комплиментом этого автора. Требует доработки рассылки на бэкенде: сейчас `GiveComplimentJob` шлёт один случайный комплимент всем подписчикам без учёта автора.
6. Автор видит подписчика в разделе «Подписчики».

Плюс проверка на Android Chrome и десктопном Chrome. `npm run lint`, `npm test`, `npm run build` проходят в CI.

## 5. Архитектура

### 5.1 Маршруты

| Путь | Доступ | Чанк | Назначение |
|---|---|---|---|
| `/` | все | `landing` | Лендинг: что это, «Войти», «Зарегистрироваться». Если устройство подписано, сверху карточка «Вы подписаны» с отпиской. Если приложение запущено с экрана «Домой» без подписки, поле «Вставьте ссылку или код» |
| `/s/:code` | все, **без входа** | `subscribe` | Подписка по коду |
| `/auth/callback` | все | `cabinet` | Обработка возврата из Keycloak |
| `/auth/signup` | все | `cabinet` | Редирект в Keycloak сразу на форму регистрации |
| `/app` | автор | `cabinet` | Редирект на `/app/compliments` |
| `/app/compliments` | автор | `cabinet` | Комплименты |
| `/app/invite` | автор | `cabinet` | Создание ссылки |
| `/app/subscribers` | автор | `cabinet` | Подписчики |
| `*` | все | `landing` | 404 |

`AuthProvider` и `QueryClientProvider` оборачивают только маршруты чанка `cabinet` (`/auth/*`, `/app/*`). Чанки `landing` и `subscribe` не импортируют `oidc-client-ts`, TanStack Query и `authedApi`.

### 5.2 Структура `src/`

```
src/
├── main.tsx                  # createRoot + RouterProvider
├── app/
│   ├── router.tsx            # таблица маршрутов, React.lazy, error boundary
│   └── config.ts             # типизированное чтение window.APP_CONFIG
├── shared/
│   ├── api/
│   │   ├── http.ts           # fetch-обёртка, ApiError, разбор ошибок бэкенда
│   │   ├── publicApi.ts      # vapid, subscribe, unsubscribe — БЕЗ Authorization
│   │   ├── authedApi.ts      # комплименты, ссылка, подписчики — с Bearer
│   │   └── types.ts          # DTO
│   ├── push/
│   │   ├── support.ts        # поддержка SW/Push/Notification, iOS, standalone
│   │   ├── serviceWorker.ts  # регистрация и ожидание активации SW
│   │   ├── pushSubscription.ts # subscribe/unsubscribe, urlBase64ToUint8Array
│   │   └── localRecord.ts    # запись «устройство подписано по коду X»
│   └── ui/                   # Button, Card, Field, Modal, Toast, Spinner, EmptyState, ErrorState
├── features/
│   ├── auth/                 # userManager, AuthLayout, RequireAuth, CallbackPage, SignupRedirect
│   ├── subscribe/            # SubscribePage, машина состояний, IosInstallHint, dynamicManifest
│   ├── compliments/          # ComplimentsPage, ComplimentCard, ComplimentForm, BulkImport, parseBulk
│   ├── invite/               # InvitePage, buildInviteUrl
│   └── subscribers/          # SubscribersPage, parseUserAgent
└── pages/
    ├── LandingPage.tsx
    ├── CabinetLayout.tsx     # шапка (имя, «Выйти») + боковая навигация; на узком экране — вкладки сверху
    └── NotFoundPage.tsx
```

`public/service-worker.js` остаётся обычным JS-файлом без сборки.

### 5.3 Конфиг

Механизм не меняется: `public/config.js` (значения для dev) перезаписывается `entrypoint.sh` при старте контейнера.

```js
window.APP_CONFIG = {
  API_BASE_URL: '',                 // '' = тот же origin (прод за nginx, dev через proxy Vite)
  OIDC_AUTHORITY: 'http://localhost:8080/realms/pulse-app',
  OIDC_CLIENT_ID: 'pulse-web',
};
```

`app/config.ts` отдаёт типизированный объект. Если `OIDC_AUTHORITY` или `OIDC_CLIENT_ID` нет, при первом обращении из кабинета бросается ошибка с понятным текстом. Страница подписки эти поля не читает.

## 6. Сценарий получателя (`/s/:code`)

### 6.1 Требование: без аутентификации

- Страница не находится внутри `AuthProvider`, не загружает код OIDC и не делает редиректов в Keycloak.
- Все запросы идут через `publicApi` без заголовка `Authorization`.
- Покрыто тестами (раздел 10).

### 6.2 Локальная запись о подписке

После успешной подписки в `localStorage` сохраняется `pulse.subscription = { code, endpoint, subscribedAt }`. Запись нужна потому, что `SubscriptionPush.Endpoint` на бэкенде уникален: одно устройство сейчас может быть подписано только на одного автора, а повторный `POST` с тем же endpoint вызывает 500.

### 6.3 Состояния страницы

При открытии:

1. `unsupported`: нет `serviceWorker`, `PushManager` или `Notification`. Текст «Этот браузер не поддерживает уведомления», для iOS ниже 16.4 предложение обновить систему.
2. `ios-install`: iOS, страница открыта во вкладке Safari (не standalone). Вместо кнопки инструкция: «Поделиться → На экран „Домой“ → открыть Pulse с экрана „Домой“ и нажать „Подписаться“». Плюс кнопка «Скопировать ссылку» для страховочного сценария (6.6).
3. Регистрируется SW, читается `pushManager.getSubscription()` и локальная запись. Если запись есть, а браузерной подписки нет (разрешение отозвано, данные очищены), запись удаляется. Дальше:
   - запись с этим же `code` и тем же `endpoint` → `subscribed`;
   - запись с другим `code` и браузерная подписка есть → `other-author`: «Это устройство уже получает комплименты от другого человека. Можно получать только от одного. Переключиться?»;
   - иначе → `ready`: «Вам прислали приглашение получать комплименты» и кнопка «Подписаться».

Действие «Подписаться» (в `ready` или «Переключиться» в `other-author`) запускается только по нажатию, иначе iOS не покажет запрос разрешения:

1. `Notification.requestPermission()`. Если не `granted` → `denied`: инструкция, где включить уведомления для сайта или приложения.
2. Если есть браузерная подписка:
   - если есть локальная запись о другом коде, сначала `DELETE /api/subscribe?endpoint=<старый>` (ошибки игнорируются);
   - затем `subscription.unsubscribe()`.
   Новая подписка всегда создаётся с нуля, чтобы endpoint был новым.
3. `GET /api/vapid` → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.
4. `POST /api/subscribe { endpoint, keys: { p256dh, auth }, userAgent, inviteCode: code }`.
5. Успех → запись в `localStorage` → `success`: «Готово! Комплименты будут приходить уведомлениями».

Ошибки шага 4:

- `400` → `invalid-link`: «Ссылка недействительна или уже использована. Попросите новую». Разрешение не отзывается, браузерная подписка остаётся (при следующей попытке она будет пересоздана).
- `5xx` или сеть → `error` с кнопкой «Повторить» (повторяются шаги 3–4).

`subscribed`: «Вы подписаны» + «Отписаться».

### 6.4 Отписка

`DELETE /api/subscribe?endpoint=…` (без авторизации) → `subscription.unsubscribe()` → удаляется локальная запись → на `/s/:code` снова `ready`, на `/` пропадает карточка «Вы подписаны». Если бэкенд ответил ошибкой, браузерная отписка всё равно выполняется, пользователю показывается предупреждение.

### 6.5 Лендинг и подписка

Лендинг не регистрирует SW. Он вызывает `navigator.serviceWorker.getRegistration()` и, если регистрация есть, `getSubscription()`. Если подписка есть, показывается карточка «Вы подписаны» с отпиской (тот же код, что в 6.4).

### 6.6 iPhone: сохранение кода после «На экран „Домой“»

Push на iOS работает только в приложении с экрана «Домой», а его хранилище отделено от Safari. Нужно, чтобы установленное приложение стартовало на `/s/<код>`, а не на `/`.

**Задача 0 плана — спайк на реальном iPhone.** Проверяется по порядку, берётся первый работающий вариант:

- (а) статический `manifest.json` со `start_url: "/"`. Может оказаться, что iOS запоминает текущий URL сам.
- (б) на `/s/:code` скрипт заменяет `href` у `<link rel="manifest">` на Blob URL манифеста с абсолютным `start_url: "<origin>/s/<код>"`.
- (в) nginx отдаёт манифест для кода: `location ~ ^/s/([A-Za-z0-9-]+)/manifest\.webmanifest$` возвращает JSON со `start_url` `/s/$1`. Для путей `/s/…` в `index.html` через `sub_filter` подставляется ссылка на этот манифест. Всё делается внутри репозитория фронта, бэкенд не меняется.

Страховка реализуется всегда: на `/` в режиме standalone без подписки есть поле «Вставьте ссылку или код» (принимает и полный URL, и код) и кнопка «Вставить из буфера». Страница `ios-install` в Safari предлагает скопировать ссылку до установки.

### 6.7 Service worker (`public/service-worker.js`)

- `push`: формат payload не меняется, `{ notification: { title, body, icon, badge, data } }`. Устройства, подписанные раньше, продолжают получать уведомления.
- `notificationclick`: фокус на открытом окне или `openWindow(data.url ?? '/')`.
- **Обработчик `fetch` и кэширование удаляются.** Сейчас SW кэширует все ответы, включая `/api`, а на POST `cache.put` падает с ошибкой. Для push это не нужно, а данные кабинета так кэшировать нельзя.
- `install` → `skipWaiting()`, `activate` → удаление старых кэшей `pulseapp-*` + `clients.claim()`.

## 7. Вход автора

### 7.1 Keycloak

Нужен public-клиент (настраивается в realm `pulse-app`, см. документ по бэкенду):

- Client ID `pulse-web`, Client authentication **off**, Standard flow **on**, Direct access grants **off**, PKCE `S256`.
- Valid redirect URIs: `https://pulse.lvakarin.ru/auth/callback`, `http://localhost:5173/auth/callback`.
- Post logout redirect URIs: `https://pulse.lvakarin.ru/`, `http://localhost:5173/`.
- Web origins: `+`.
- Client scope `basic` подключён (иначе в токене нет `sub`, бэкенд отклонит токен).
- В realm включена регистрация (User registration).

### 7.2 Клиент

- `features/auth/userManager.ts` создаёт один `UserManager` из `oidc-client-ts`:
  - `authority`, `client_id` из конфига;
  - `redirect_uri = <origin>/auth/callback`;
  - `post_logout_redirect_uri = <origin>/`;
  - `scope = 'openid profile email'`;
  - `userStore` в `localStorage`, чтобы не входить заново при каждом открытии с телефона;
  - `automaticSilentRenew: true` (обновление по refresh token).
- `AuthLayout` (корень чанка `cabinet`) оборачивает маршруты в `AuthProvider userManager={userManager}` и `QueryClientProvider`.
- `RequireAuth`: если пользователь не вошёл, `signinRedirect({ state: { returnTo } })`.
- `/auth/signup`: `signinRedirect({ prompt: 'create' })`. Keycloak откроет форму регистрации. Поддержку `prompt=create` проверить на используемой версии Keycloak, см. риски.
- `/auth/callback`: `signinRedirectCallback()`, затем `navigate(state.returnTo ?? '/app', { replace: true })`. Ошибка → экран «Не удалось войти» с кнопкой «Попробовать снова».
- «Выйти»: `signoutRedirect()`.
- В шапке имя из `profile.preferred_username` (бэкенд берёт `DisplayName` из того же клейма).

### 7.3 Токен в запросах

`authedApi` берёт `access_token` из `userManager.getUser()`. На `401`: один раз `userManager.signinSilent()` и повтор запроса. Если снова `401` или обновление не удалось, `signinRedirect()` с возвратом на текущую страницу.

## 8. Кабинет автора

Общее: **сначала десктоп**, основная ширина от 1024 px.

- Раскладка: шапка (логотип, имя автора, «Выйти») + боковая навигация слева («Комплименты», «Ссылка», «Подписчики») + область контента шириной до 1100 px.
- Списки — таблицы, как в прежней админке.
- Одна точка перелома, 768 px. Ниже неё кабинет остаётся рабочим, но не оптимизируется: боковая навигация становится вкладками сверху, строки таблиц — карточками. Горизонтальной прокрутки страницы нет.
- Результат изменений показывается тостом, ошибки загрузки — блоком `ErrorState` с кнопкой «Повторить».

### 8.1 Комплименты (`/app/compliments`)

- Запрос `['compliments']` → `GET /api/compliment`. Сортировка на клиенте: новые сверху.
- Над таблицей: заголовок раздела со счётчиком («Комплименты · 24»), кнопки «Добавить» и «Добавить списком».
- Таблица, колонки: «Заголовок», «Текст» (обрезается до 2 строк, полный текст во всплывающей подсказке и в модалке правки), «Статус» («В очереди» или «Отправлен» по `isBeenPushed`), «Создан», «Действия».
- Действия строки: «Изменить» (модалка с формой), «Удалить» (подтверждение), «Вернуть в очередь» (только у отправленных: `PUT` с `isBeenPushed=false`).
- «Добавить» открывает модалку с формой: заголовок (обязательно, ≤ 100 символов) и текст (обязательно, ≤ 500). Лимиты те же, что в базе. У полей счётчики символов и подсказка «на экране блокировки видно 2–4 строки».
- «Добавить списком» (`BulkImport`, модалка): поле «Заголовок для всех» (по умолчанию «Комплимент для тебя 💌», ≤ 100) и поле текста. Каждая непустая строка — отдельный комплимент, пробелы по краям обрезаются. Строки длиннее 500 символов и пустой результат дают ошибку до отправки. Предпросмотр: «Будет добавлено N». Отправка → `POST /api/compliment/batch`.
- После любой мутации инвалидируется `['compliments']`.
- Пустое состояние: «Пока нет комплиментов. Добавьте первый или вставьте список».
- `PUT` отправляет все три поля (`title`, `text`, `isBeenPushed`), потому что DTO на бэкенде полный.

### 8.2 Ссылка (`/app/invite`)

- Кнопка «Создать ссылку» → `POST /api/subscription/create` → код → URL `${window.location.origin}/s/${code}`.
- Показывается: ссылка (моноширинно, с переносом), «Скопировать» (`navigator.clipboard.writeText`, при ошибке ссылка выделяется для ручного копирования), «Поделиться» (кнопка есть, если есть `navigator.share`: `{ title: 'Pulse', text: 'Подпишись на мои комплименты', url }`).
- Подпись: «Ссылка одноразовая и действует 24 часа. Для каждого человека и устройства создайте новую».
- Созданная ссылка не хранится: при уходе со страницы пропадает. Об этом предупреждает подпись.

### 8.3 Подписчики (`/app/subscribers`)

- Запрос `['subscriptions']` → `GET /api/subscription`.
- Таблица, колонки: «Устройство» (`parseUserAgent`: «iPhone · Safari», «Android · Chrome», «Windows · Chrome», «Mac · Safari», иначе «Неизвестное устройство»; полный UserAgent во всплывающей подсказке), «Подписан» (дата и время), «Статус» (бейдж «Активна» или «Отключена»).
- Сортировка: активные сверху, внутри по дате, новые сверху.
- Пустое состояние: «Пока никто не подписан» и ссылка на `/app/invite`.

## 9. Контракт API, который использует фронт

Имена полей JSON — camelCase, кроме ошибок из `ErrorMiddleware`.

| Метод и путь | Клиент | Запрос | Ответ | Статус на бэкенде |
|---|---|---|---|---|
| `GET /api/vapid` | public | — | `{ publicKey: string }` | есть |
| `POST /api/subscribe` | public | `{ endpoint, keys: { p256dh, auth }, userAgent, inviteCode }` | `200 { id, message }` | есть |
| `DELETE /api/subscribe?endpoint=` | public | — | `200 { success, message }` | есть |
| `GET /api/compliment` | authed | — | `ComplimentDto[]` | есть, **нужна фильтрация по автору** |
| `POST /api/compliment` | authed | `{ title, text }` | `string` (id) | есть |
| `POST /api/compliment/batch` | authed | `{ title, text }[]` | `string[]` (id) | есть |
| `PUT /api/compliment/{id}` | authed | `{ title, text, isBeenPushed }` | `204` | есть, **нужна проверка владельца** |
| `DELETE /api/compliment/{id}` | authed | — | `204` | есть, **нужна проверка владельца** |
| `POST /api/subscription/create` | authed | — | `string` (код) | есть по пути `/create`, **нужно исправить маршрут** |
| `GET /api/subscription` | authed | — | `MySubscriptionDto[]` | **нет, нужен** |

```ts
type ComplimentDto = {
  id: string; title: string; text: string;
  isBeenPushed: boolean; createdAt: string; updatedAt: string;
};
type MySubscriptionDto = {
  id: string; userAgent: string | null; createdAt: string; isActive: boolean;
};
type BackendError = { Message: string; TraceId?: string | null }; // PascalCase: ErrorMiddleware сериализует без camelCase
```

Код приглашения возвращается через `Ok(string)`. В зависимости от `Accept` это `text/plain` или JSON-строка. `http.ts` читает тело как текст и при `Content-Type: application/json` делает `JSON.parse`.

## 10. Ошибки, UX, тесты

### 10.1 Обработка ошибок

- `http.ts` превращает ответ `!ok` в `ApiError { status, message, traceId }`. Если тело — JSON, `message` берётся из `Message ?? message`, `traceId` из `TraceId ?? traceId` (переживёт переход бэкенда на camelCase). Иначе текст ответа или `HTTP <status>`.
- Сбой сети → `ApiError { status: 0 }`.
- В тосте ошибки мелким шрифтом `Код: <traceId>`, если он есть.
- Error boundary на маршрутах: «Что-то пошло не так» и «Обновить страницу».

### 10.2 Тесты (Vitest + Testing Library + MSW, окружение jsdom)

Юнит-тесты:

- `http.ts`: base URL, 204 → `null`, разбор `{ Message, TraceId }`, текстовые ошибки, сбой сети, разбор кода приглашения из `text/plain` и JSON.
- `publicApi`: **ни один запрос не содержит `Authorization`**.
- `authedApi`: Bearer-токен подставляется; на 401 один `signinSilent` и повтор; повторный 401 → `signinRedirect`.
- `pushSubscription`: `urlBase64ToUint8Array`, полный цикл подписки с замоканными `PushManager` и `Notification`, пересоздание существующей подписки.
- `support.ts`: определение iOS, версии и standalone.
- `localRecord.ts`, `parseBulk`, `parseUserAgent`, `buildInviteUrl`.

Компонентные тесты:

- `SubscribePage` во всех состояниях: `unsupported`, `ios-install`, `ready`, `denied`, `success`, `invalid-link` (400), `error` (5xx и сеть) с повтором, `subscribed`, `other-author` с переключением.
- **`SubscribePage` рендерится в роутере без `AuthProvider` и не падает.**
- `ComplimentsPage`: список, пустое состояние, создание, редактирование, удаление, «Вернуть в очередь», импорт списком с предпросмотром и ошибками валидации.
- `InvitePage`: создание, копирование, «Поделиться» (есть и нет `navigator.share`).
- `SubscribersPage`: список, сортировка, пустое состояние.
- `RequireAuth`: неавторизованный пользователь уходит в `signinRedirect` с `returnTo`.

Ручной чек-лист (в README): iPhone (iOS ≥ 16.4) — спайк и финальная цепочка из раздела 4; Android Chrome; десктопный Chrome — подписка, получение push, клик по уведомлению, отписка.

### 10.3 Качество

- ESLint (flat config): `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`.
- `tsconfig` в режиме `strict`.
- Скрипты: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `lint`, `test`, `test:watch`.
- Запрет импортов через ESLint `no-restricted-imports`: `features/subscribe/**`, `pages/LandingPage.tsx`, `pages/NotFoundPage.tsx` и `shared/**` (кроме `shared/api/authedApi.ts`) не импортируют `oidc-client-ts`, `react-oidc-context`, `@tanstack/react-query`, `authedApi` и модули авторизации. Так требование 6.1 проверяется автоматически.

## 11. Сборка, деплой, CI

- `Dockerfile`: без изменений по устройству (сборка на `node:22-alpine`, раздача через `nginx:alpine`). Проверка типов идёт внутри `npm run build`.
- `entrypoint.sh`: пишет в `config.js` три переменные: `API_BASE_URL`, `OIDC_AUTHORITY`, `OIDC_CLIENT_ID`.
- `nginx.conf`: SPA-fallback уже покрывает `/s/*`, `/auth/*`, `/app/*`. Если спайк выберет вариант (в), добавляются `location` для манифеста по коду и `sub_filter`. `manifest.json` отдаётся с `Cache-Control: no-cache`.
- `vite.config.ts`: proxy `/api` → `http://localhost:5050` остаётся; настройки `test` (jsdom, setup-файл с MSW).
- CI (`.github/workflows/back-dev.yml`): перед сборкой образа шаги `actions/setup-node` (Node 22), `npm ci`, `npm run lint`, `npm test`.
- `README.md` переписывается: запуск, конфиг, Keycloak-клиент, ручной чек-лист.
- Переменные для сервиса `frontend` в `PulseApp.Infrastructure/main.yml`: `OIDC_AUTHORITY`, `OIDC_CLIENT_ID` (см. документ по бэкенду).

## 12. Риски и открытые вопросы

| Риск | Что делаем |
|---|---|
| iOS теряет код после «На экран „Домой“» | Спайк в задаче 0, варианты (а)–(в), страховочное поле для кода |
| Keycloak не поддерживает `prompt=create` на используемой версии | Проверить при реализации `/auth/signup`. Запасной вариант: редирект на `<authority>/protocol/openid-connect/registrations` с теми же параметрами. Если с `oidc-client-ts` не получится — кнопка «Зарегистрироваться» ведёт на обычный вход, где есть ссылка «Регистрация» |
| Одно устройство — один автор (уникальный endpoint) | Фронт явно предлагает переключиться (6.3). Поддержка нескольких авторов — решение по бэкенду |
| Бэкенд не готов к кабинету (фильтрация, маршрут, `GET /api/subscription`, рассылка по автору) | Кабинет разрабатывается и тестируется на MSW по контракту из раздела 9. Проверка всей цепочки — после правок бэкенда |
| Нет развёрнутого Keycloak на проде | Требование к инфраструктуре, см. документ по бэкенду |

## 13. Порядок работ

0. **Спайк iOS** (одноразовый, код не сохраняется): варианты (а)–(в) из 6.6, вывод записывается в эту спецификацию.
1. **Каркас:** TypeScript, React Router, ESLint, Vitest + MSW, `config.ts`, `entrypoint.sh`, CI. Удаление старого `SubscribeCard`.
2. **Общий слой:** `shared/api` (http, publicApi, types), `shared/push`, `shared/ui` (базовые компоненты, Toast). Чистка service worker.
3. **Подписка:** `/s/:code` со всеми состояниями, лендинг `/` с карточкой подписки и страховочным полем. Работает с текущим бэкендом.
4. **Вход:** `userManager`, `AuthLayout`, `RequireAuth`, `/auth/callback`, `/auth/signup`, `CabinetLayout`, `authedApi`.
5. **Комплименты:** список, форма, редактирование, удаление, «Вернуть в очередь», импорт списком.
6. **Ссылка:** создание, копирование, «Поделиться».
7. **Подписчики:** список, `parseUserAgent`.
8. **Выпуск:** nginx (по итогам спайка), README, переменные окружения, ручной чек-лист на iPhone, Android и десктопе.
