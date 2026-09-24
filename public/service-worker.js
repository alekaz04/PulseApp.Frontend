// Service Worker Pulse: показывает push-уведомления. Запросы не кэширует —
// данные кабинета так хранить нельзя, а для push кэш не нужен.

const OLD_CACHE_PREFIX = 'pulseapp-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith(OLD_CACHE_PREFIX)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

// Формат от бэкенда: { notification: { title, body, icon, badge, data } }
self.addEventListener('push', (event) => {
  let notification = {
    title: 'Pulse',
    body: 'У вас новое уведомление',
    icon: '/favicon/web-app-manifest-192x192.png',
    badge: '/favicon/favicon-96x96.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload && payload.notification) {
        notification = {
          title: payload.notification.title || notification.title,
          body: payload.notification.body || notification.body,
          icon: payload.notification.icon || notification.icon,
          badge: payload.notification.badge || notification.badge,
          data: payload.notification.data || notification.data,
        };
      }
    } catch (error) {
      console.error('[Service Worker] Не удалось разобрать push:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      vibrate: [200, 100, 200],
      tag: 'pulseapp-notification',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
    }),
  );
});
