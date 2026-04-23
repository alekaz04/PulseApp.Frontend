import { useState, useEffect, useRef } from 'react';
import './SubscribeCard.css';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SubscribeCard() {
  const [status, setStatus] = useState('init');
  const [statusText, setStatusText] = useState('Инициализация...');
  const [errorDetail, setErrorDetail] = useState('');
  const [unsupported, setUnsupported] = useState(false);
  const registrationRef = useRef(null);

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    if (!('serviceWorker' in navigator)) {
      setUnsupported(true);
      setStatus('error');
      setStatusText('Ошибка: браузер не поддерживается');
      setErrorDetail('Service Worker не поддерживается в этом браузере');
      return;
    }
    if (!('PushManager' in window)) {
      setUnsupported(true);
      setStatus('error');
      setStatusText('Ошибка: браузер не поддерживается');
      setErrorDetail('Push-уведомления не поддерживаются в этом браузере');
      return;
    }
    try {
      const registration = await registerServiceWorker();
      registrationRef.current = registration;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        setStatus('subscribed');
        setStatusText('Вы подписаны на уведомления');
      } else {
        setStatus('ready');
        setStatusText('Готово к подписке');
      }
    } catch (error) {
      console.error('[PulseApp] Initialization error:', error);
      setStatus('error');
      setStatusText('Ошибка инициализации');
      setErrorDetail('Ошибка инициализации: ' + error.message);
    }
  }

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });
    if (registration.active) {
      return registration;
    }
    const worker = registration.installing || registration.waiting;
    if (worker) {
      await new Promise((resolve) => {
        if (worker.state === 'activated') { resolve(); return; }
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
        });
      });
    }
    return registration;
  }

  async function handleSubscribe() {
    const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL ?? '';
    setStatus('loading');
    setStatusText('Подписываемся...');
    setErrorDetail('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Разрешение на уведомления не получено');
      }
      const vapidResponse = await fetch(`${apiBaseUrl}/api/vapid`);
      if (!vapidResponse.ok) throw new Error(`HTTP ${vapidResponse.status}`);
      const { publicKey } = await vapidResponse.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const { endpoint, keys } = subscription.toJSON();
      const saveResponse = await fetch(`${apiBaseUrl}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
          userAgent: navigator.userAgent,
        }),
      });
      if (!saveResponse.ok) {
        const text = await saveResponse.text();
        throw new Error(`Server error: ${saveResponse.status} - ${text}`);
      }
      setStatus('subscribed');
      setStatusText('Вы подписаны на уведомления');
    } catch (error) {
      console.error('[PulseApp] Subscription error:', error);
      setStatus('error');
      setStatusText('Ошибка подписки');
      setErrorDetail('Ошибка подписки: ' + error.message);
    }
  }

  async function handleUnsubscribe() {
    const apiBaseUrl = window.APP_CONFIG?.API_BASE_URL ?? '';
    setStatus('loading');
    setStatusText('Отписываемся...');
    setErrorDetail('');
    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (subscription) {
        const { endpoint } = subscription;
        const deleteResponse = await fetch(`${apiBaseUrl}/api/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: 'DELETE',
        });
        if (!deleteResponse.ok) {
          console.warn('[PulseApp] Backend unsubscribe warning:', deleteResponse.status);
        }
        await subscription.unsubscribe();
      }
      setStatus('ready');
      setStatusText('Готово к подписке');
    } catch (error) {
      console.error('[PulseApp] Unsubscription error:', error);
      setStatus('error');
      setStatusText('Ошибка отписки');
      setErrorDetail('Ошибка отписки: ' + error.message);
    }
  }

  const statusClass = [
    'subscribe-card__status',
    status === 'subscribed' && 'subscribe-card__status--subscribed',
    status === 'error' && 'subscribe-card__status--error',
  ].filter(Boolean).join(' ');

  const statusIcon = status === 'subscribed' ? '✅' : status === 'error' ? '❌' : '⏳';
  const buttonDisabled = status === 'init' || status === 'loading';
  const buttonText = status === 'subscribed'
    ? 'Отписаться от уведомлений'
    : 'Подписаться на уведомления';
  const buttonHandler = status === 'subscribed' ? handleUnsubscribe : handleSubscribe;

  return (
    <div className="subscribe-card">
      <h1 className="subscribe-card__title">PulseApp</h1>
      <div className={statusClass}>
        <span>{statusIcon}</span>
        <span>{statusText}</span>
      </div>
      {errorDetail && (
        <p className="subscribe-card__error-detail">{errorDetail}</p>
      )}
      {!unsupported && (
        <button
          className="subscribe-card__btn"
          onClick={buttonHandler}
          disabled={buttonDisabled}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
