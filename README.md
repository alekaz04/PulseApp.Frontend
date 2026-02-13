# PulseApp Frontend

PWA приложение для получения ежедневных комплиментов через push-уведомления.

## Технологии
- **HTML5 / CSS3 / JavaScript** (Vanilla JS)
- **PWA** (Progressive Web App)
- **Service Worker** для push-уведомлений и offline-режима
- **Web Push API** для уведомлений

## Структура проекта
```
PulseApp.Frontend/
├── Dockerfile              # Docker образ с Nginx
├── nginx.conf             # Конфигурация Nginx для PWA
├── .dockerignore          # Исключения для Docker
├── index.html             # Главная страница
├── app.js                 # Логика приложения
├── styles.css             # Стили
├── manifest.json          # PWA манифест
├── service-worker.js      # Service Worker для push и кэширования
└── icons/                 # Иконки PWA
```

## Локальная разработка

### Вариант 1: Live Server (VS Code)
1. Установите расширение "Live Server" в VS Code
2. Откройте `index.html`
3. Нажмите "Go Live" в правом нижнем углу
4. Приложение откроется на `http://localhost:5500`

### Вариант 2: Python HTTP Server
```bash
cd PulseApp.Frontend
python -m http.server 8080
```
Откройте http://localhost:8080

### Вариант 3: Node.js HTTP Server
```bash
npx http-server -p 8080
```

## Docker

### Сборка образа
```bash
docker build -t pulseapp-frontend:latest .
```

### Запуск контейнера
```bash
docker run -d -p 8080:80 --name pulseapp-frontend pulseapp-frontend:latest
```

Приложение будет доступно на http://localhost:8080

### Остановка и удаление
```bash
docker stop pulseapp-frontend
docker rm pulseapp-frontend
```

## Конфигурация API

По умолчанию приложение обращается к backend на `http://localhost:5050`.

Для изменения URL API отредактируйте `app.js`:
```javascript
const API_BASE_URL = 'https://your-domain.com';
```

## PWA Установка

### iOS (iPhone/iPad)
1. Откройте приложение в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой)
3. Выберите "На экран «Домой»"
4. Нажмите "Добавить"

**Требования для iOS:**
- iOS 16.4+ для поддержки Web Push
- HTTPS (обязательно)
- PWA должна быть установлена на Home Screen для работы push-уведомлений

### Android
1. Откройте приложение в Chrome
2. Нажмите меню (три точки)
3. Выберите "Добавить на главный экран"
4. Нажмите "Установить"

## Push-уведомления

### Подписка
1. Нажмите кнопку "Подписаться на уведомления"
2. Разрешите уведомления в браузере
3. Подписка сохраняется на backend

### Отписка
1. Нажмите кнопку "Отписаться от уведомлений"
2. Подписка деактивируется на backend и удаляется локально

### Отладка
Откройте Developer Tools → Console для просмотра логов:
- `[PulseApp]` - логи приложения
- `[Service Worker]` - логи Service Worker

## Nginx конфигурация

Файл `nginx.conf` оптимизирован для PWA:
- ✅ Правильные MIME types для manifest.json и service-worker.js
- ✅ Отключено кэширование для Service Worker (критично!)
- ✅ Оптимальное кэширование для статики
- ✅ Сжатие (gzip)
- ✅ Security headers
- ✅ SPA routing (fallback на index.html)
- ✅ Health check endpoint (/health)

## Production Deployment

### С Docker Compose (рекомендуется)
```yaml
services:
  frontend:
    image: pulseapp-frontend:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

### С Nginx Reverse Proxy + HTTPS
```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Известные ограничения

### iOS Safari
- ❌ Badge API не поддерживается
- ❌ Background Sync API не поддерживается
- ⚠️ Service Worker может быть убит системой для экономии ресурсов
- ⚠️ Push работает только после установки PWA на Home Screen
- ⚠️ Лимит кэша ~50MB

### Общие
- HTTPS обязателен для Production
- Push API требует VAPID ключи на backend

## Troubleshooting

### Push-уведомления не приходят
1. Проверьте, что приложение установлено на Home Screen (iOS)
2. Проверьте, что разрешение на уведомления дано
3. Откройте Console и проверьте ошибки
4. Убедитесь, что backend работает и отправляет уведомления

### Service Worker не регистрируется
1. Убедитесь, что используется HTTPS или localhost
2. Проверьте Console на ошибки
3. Очистите кэш браузера и Service Workers

### Приложение не кэширует контент
1. Проверьте, что Service Worker активен (DevTools → Application → Service Workers)
2. Проверьте Network tab: статика должна отдаваться из "(ServiceWorker)"
3. Обновите версию CACHE_NAME в service-worker.js

## License
MIT
