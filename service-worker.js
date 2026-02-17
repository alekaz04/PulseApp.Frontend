// Service Worker для PulseApp
// Обработка push-уведомлений и базовое кэширование

const CACHE_NAME = 'pulseapp-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/config.js',
    '/app.js',
    '/manifest.json'
];

// Установка Service Worker и кэширование статики
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker и очистка старого кэша
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Стратегия кэширования: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Клонируем ответ для кэша
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Если сеть недоступна, используем кэш
                return caches.match(event.request);
            })
    );
});

// КРИТИЧНО: Обработка push-уведомлений
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let notificationData = {
        title: 'PulseApp',
        body: 'У вас новое уведомление',
        icon: '/favicon/web-app-manifest-192x192.png',
        badge: '/favicon/favicon-96x96.png',
        data: { url: '/' }
    };

    // Парсинг данных от сервера
    if (event.data) {
        try {
            const payload = event.data.json();
            console.log('[Service Worker] Push payload:', payload);
            
            // Backend отправляет структуру: { notification: { title, body, icon, badge, data } }
            if (payload.notification) {
                notificationData = {
                    title: payload.notification.title || notificationData.title,
                    body: payload.notification.body || notificationData.body,
                    icon: payload.notification.icon || notificationData.icon,
                    badge: payload.notification.badge || notificationData.badge,
                    data: payload.notification.data || notificationData.data
                };
            }
        } catch (error) {
            console.error('[Service Worker] Failed to parse push data:', error);
            // Используем дефолтные значения
        }
    }

    // Показываем уведомление
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            vibrate: [200, 100, 200],
            tag: 'pulseapp-notification',
            requireInteraction: false
        })
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked');
    event.notification.close();

    // Открываем приложение
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Если приложение уже открыто, фокусируемся на нём
                for (let client of clientList) {
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Иначе открываем новое окно
                if (clients.openWindow) {
                    const urlToOpen = event.notification.data?.url || '/';
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
