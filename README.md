# Pulse Web

Фронт Pulse: страница подписки на комплименты по ссылке и кабинет автора.

- **Автор** регистрируется (Keycloak), добавляет комплименты, создаёт одноразовую ссылку и видит подписчиков.
- **Получатель** открывает `/s/<код>` и подписывается на push-уведомления **без регистрации**.

Спецификация: `docs/superpowers/specs/2026-09-24-pulse-web-design.md`.

## Стек

React 19, TypeScript, Vite, React Router 7, TanStack Query, oidc-client-ts + react-oidc-context, CSS Modules.
Тесты: Vitest, Testing Library, MSW.

## Маршруты

| Путь | Кто | Что |
|---|---|---|
| `/` | все | Лендинг; статус подписки устройства; в установленном приложении — поле для ссылки |
| `/s/:code` | получатель, без входа | Подписка по коду |
| `/auth/callback`, `/auth/signup` | автор | Возврат из Keycloak, регистрация |
| `/app/compliments`, `/app/invite`, `/app/subscribers` | автор | Кабинет |

## Разработка

Нужны Node ≥ 22 и бэкенд на `http://localhost:5050` (Vite проксирует на него `/api`).

```bash
npm ci
npm run dev      # http://localhost:5173
npm test
npm run lint
npm run build
```

Конфиг для разработки — `public/config.js`. В Docker его перезаписывает `entrypoint.sh` из переменных окружения.

### Keycloak для разработки

```bash
docker run --rm -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:26.0 start-dev
```

В `http://localhost:8080` (admin/admin):

1. Realm `pulse-app`; Realm settings → Login → User registration: On.
2. Client `pulse-web`: Client authentication Off, Standard flow On, Direct access grants Off.
3. Valid redirect URIs `http://localhost:5173/auth/callback`, Valid post logout redirect URIs `http://localhost:5173/`, Web origins `+`.
4. Advanced → PKCE method `S256`. Client scope `basic` подключён (без него в токене нет `sub`).

## Docker

```bash
docker build -t pulse-frontend .
docker run --rm -p 8080:80 \
  -e API_BASE_URL= \
  -e OIDC_AUTHORITY=https://<keycloak>/realms/pulse-app \
  -e OIDC_CLIENT_ID=pulse-web \
  pulse-frontend
```

`API_BASE_URL` пустой: фронт и API на одном домене, nginx хоста проксирует `/api/` на бэкенд.

## Ручная проверка перед выпуском

- [ ] iPhone (iOS ≥ 16.4): открыть ссылку в Safari → «На экран „Домой“» → открыть Pulse с экрана «Домой» → «Подписаться» → разрешить → прийти push; клик по уведомлению открывает Pulse; «Отписаться» работает.
- [ ] iPhone: после «На экран „Домой“» приложение открывается на странице ссылки, а не на главной. Если на главной — вставить ссылку в поле «Вставьте ссылку или код приглашения» и отметить это в спецификации (раздел 6.6).
- [ ] iPhone: ссылка, открытая в Telegram, показывает инструкцию начиная с «Открыть в Safari».
- [ ] Android Chrome: подписка, push, клик, отписка.
- [ ] Десктопный Chrome: подписка, push, клик, отписка.
- [ ] Кабинет на десктопе: регистрация → комплименты (добавить, списком, изменить, вернуть в очередь, удалить) → ссылка (скопировать) → подписчик появился в «Подписчиках».
- [ ] Повторное открытие использованной ссылки на другом устройстве — «Ссылка недействительна».

## Ограничения iOS

- Push работает только в приложении с экрана «Домой», iOS 16.4+.
- У приложения с экрана «Домой» своё хранилище, отдельное от Safari. Если код ссылки не сохранился при установке, его можно вставить на главном экране (см. раздел 6.6 спецификации).
