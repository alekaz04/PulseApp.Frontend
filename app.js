// PulseApp - Frontend Logic
// Управление подпиской на push-уведомления

// Конфигурация API
const API_BASE_URL = 'https://pulse.lvakarin.ru';
const API_ENDPOINTS = {
    vapidPublicKey: `${API_BASE_URL}/api/vapid`,
    subscribe: `${API_BASE_URL}/api/subscribe`,
    unsubscribe: `${API_BASE_URL}/api/subscribe`
};

// DOM элементы
let subscribeBtn;
let statusMessage;
let statusIcon;
let statusText;
let errorMessage;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[PulseApp] Initializing...');
    
    // Получаем DOM элементы
    subscribeBtn = document.getElementById('subscribe-btn');
    statusMessage = document.getElementById('status-message');
    statusIcon = statusMessage.querySelector('.status-icon');
    statusText = statusMessage.querySelector('.status-text');
    errorMessage = document.getElementById('error-message');

    // Проверяем поддержку Service Worker и Push API
    if (!('serviceWorker' in navigator)) {
        showError('Service Worker не поддерживается в этом браузере');
        return;
    }

    if (!('PushManager' in window)) {
        showError('Push-уведомления не поддерживаются в этом браузере');
        return;
    }

    // Регистрируем Service Worker
    try {
        const registration = await registerServiceWorker();
        console.log('[PulseApp] Service Worker registered:', registration);
        
        // Проверяем текущую подписку
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            updateStatus('subscribed', 'Вы подписаны на уведомления', '✅');
            subscribeBtn.textContent = 'Отписаться от уведомлений';
            subscribeBtn.onclick = () => unsubscribeFromPush(registration);
        } else {
            updateStatus('ready', 'Готово к подписке', '⏳');
            subscribeBtn.onclick = () => subscribeToPush(registration);
        }
    } catch (error) {
        console.error('[PulseApp] Initialization error:', error);
        showError('Ошибка инициализации: ' + error.message);
    }
});

// Регистрация Service Worker
async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });
        
        // Ждём, пока Service Worker станет активным
        if (registration.installing) {
            console.log('[PulseApp] Service Worker installing...');
            await waitForServiceWorkerActivation(registration);
        } else if (registration.waiting) {
            console.log('[PulseApp] Service Worker waiting...');
            await waitForServiceWorkerActivation(registration);
        } else if (registration.active) {
            console.log('[PulseApp] Service Worker active');
        }
        
        return registration;
    } catch (error) {
        console.error('[PulseApp] Service Worker registration failed:', error);
        throw error;
    }
}

// Ожидание активации Service Worker
function waitForServiceWorkerActivation(registration) {
    return new Promise((resolve) => {
        if (registration.active) {
            resolve();
            return;
        }
        
        const worker = registration.installing || registration.waiting;
        worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') {
                resolve();
            }
        });
    });
}

// Подписка на push-уведомления
async function subscribeToPush(registration) {
    try {
        subscribeBtn.disabled = true;
        updateStatus('loading', 'Подписываемся...', '⏳');
        hideError();

        // 1. Запрашиваем разрешение на уведомления
        const permission = await Notification.requestPermission();
        console.log('[PulseApp] Notification permission:', permission);
        
        if (permission !== 'granted') {
            throw new Error('Разрешение на уведомления не получено');
        }

        // 2. Получаем VAPID публичный ключ с сервера
        const vapidPublicKey = await fetchVapidPublicKey();
        console.log('[PulseApp] VAPID public key received');

        // 3. Конвертируем VAPID ключ в Uint8Array
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // 4. Подписываемся через Push Manager
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });
        
        console.log('[PulseApp] Push subscription created:', subscription);

        // 5. Отправляем подписку на backend
        await sendSubscriptionToBackend(subscription);

        // Обновляем UI
        updateStatus('subscribed', 'Вы подписаны на уведомления', '✅');
        subscribeBtn.textContent = 'Отписаться от уведомлений';
        subscribeBtn.onclick = () => unsubscribeFromPush(registration);
        subscribeBtn.disabled = false;

        console.log('[PulseApp] Successfully subscribed to push notifications');
    } catch (error) {
        console.error('[PulseApp] Subscription error:', error);
        showError('Ошибка подписки: ' + error.message);
        updateStatus('error', 'Ошибка подписки', '❌');
        subscribeBtn.disabled = false;
    }
}

// Отписка от push-уведомлений
async function unsubscribeFromPush(registration) {
    try {
        subscribeBtn.disabled = true;
        updateStatus('loading', 'Отписываемся...', '⏳');
        hideError();

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            // Сохраняем endpoint перед отпиской, т.к. после unsubscribe объект может стать недействительным
            const endpoint = subscription.endpoint;
            
            // Сначала уведомляем backend (пока подписка ещё активна)
            const response = await fetch(`${API_ENDPOINTS.unsubscribe}?endpoint=${encodeURIComponent(endpoint)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[PulseApp] Backend unsubscribe warning:', errorText);
                // Продолжаем отписку на клиенте даже если backend не ответил успешно
            } else {
                const result = await response.json();
                console.log('[PulseApp] Backend unsubscribe result:', result);
            }
            
            // Затем отписываемся на клиенте
            await subscription.unsubscribe();
            console.log('[PulseApp] Client unsubscribed successfully');
        }

        updateStatus('ready', 'Готово к подписке', '⏳');
        subscribeBtn.textContent = 'Подписаться на уведомления';
        subscribeBtn.onclick = () => subscribeToPush(registration);
        subscribeBtn.disabled = false;

        console.log('[PulseApp] Successfully unsubscribed from push notifications');
    } catch (error) {
        console.error('[PulseApp] Unsubscription error:', error);
        showError('Ошибка отписки: ' + error.message);
        updateStatus('error', 'Ошибка отписки', '❌');
        subscribeBtn.disabled = false;
    }
}

// Получение VAPID публичного ключа с backend
async function fetchVapidPublicKey() {
    try {
        const response = await fetch(API_ENDPOINTS.vapidPublicKey);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Backend возвращает объект { publicKey: "..." }
        const data = await response.json();
        return data.publicKey;
    } catch (error) {
        console.error('[PulseApp] Failed to fetch VAPID key:', error);
        throw new Error('Не удалось получить ключ с сервера');
    }
}
// Отправка подписки на backend
async function sendSubscriptionToBackend(subscription) {
    try {
        const subscriptionJson = subscription.toJSON();
        
        const payload = {
            endpoint: subscriptionJson.endpoint,
            keys: {
                p256dh: subscriptionJson.keys.p256dh,
                auth: subscriptionJson.keys.auth
            },
            userAgent: navigator.userAgent
        };

        console.log('[PulseApp] Sending subscription to backend:', payload);

        const response = await fetch(API_ENDPOINTS.subscribe, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('[PulseApp] Subscription saved on backend:', result);
    } catch (error) {
        console.error('[PulseApp] Failed to send subscription to backend:', error);
        throw new Error('Не удалось сохранить подписку на сервере');
    }
}

// Конвертация base64 URL-safe строки в Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// UI Helper функции
function updateStatus(type, text, icon) {
    statusMessage.className = 'status';
    if (type === 'subscribed') {
        statusMessage.classList.add('subscribed');
    } else if (type === 'error') {
        statusMessage.classList.add('error');
    }
    statusText.textContent = text;
    statusIcon.textContent = icon;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}
