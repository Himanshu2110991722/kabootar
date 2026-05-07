import { Capacitor } from '@capacitor/core';
import api from './api';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call after login. Requests permission, gets FCM token, saves to backend.
 * The backend subscribes the token to city/route topics automatically.
 */
export async function initPushNotifications(userId) {
  if (!userId) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await initAndroidPush();
    } else {
      await initWebPush();
    }
  } catch (err) {
    console.warn('[Push] init failed:', err.message);
  }
}

/**
 * Subscribe the current device to a specific route topic.
 * Call when user sets a frequent route or searches a specific route.
 * e.g. subscribeToRoute('Delhi', 'Mumbai')
 */
export async function subscribeToRoute(fromCity, toCity) {
  try {
    await api.post('/auth/me/fcm-subscribe', {
      topics: [routeTopic(fromCity, toCity)],
    });
  } catch {}
}

/**
 * Unsubscribe from a route topic.
 */
export async function unsubscribeFromRoute(fromCity, toCity) {
  try {
    await api.post('/auth/me/fcm-unsubscribe', {
      topics: [routeTopic(fromCity, toCity)],
    });
  } catch {}
}

// ── Android ───────────────────────────────────────────────────────────────────

async function initAndroidPush() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  // Save token to backend (backend also does city topic subscription)
  PushNotifications.addListener('registration', async ({ value: token }) => {
    await saveFcmToken(token);
  });

  // App is OPEN — show as an in-app toast instead of system notification
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    showForegroundToast(notification.title, notification.body, notification.data);
  });

  // User tapped a notification — navigate to the right screen
  PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
    navigateFromData(notification.data || {});
  });
}

// ── Web ───────────────────────────────────────────────────────────────────────

async function initWebPush() {
  if (!VAPID_KEY) { console.warn('[Push] VITE_FIREBASE_VAPID_KEY not set'); return; }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  // Register service worker
  const reg = await navigator.serviceWorker
    .register('/firebase-messaging-sw.js', { scope: '/' })
    .catch(() => null);
  if (!reg) return;

  const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
  const { default: firebaseApp } = await import('./firebase');

  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg })
    .catch(() => null);
  if (token) await saveFcmToken(token);

  // Foreground notification — app tab is open
  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    if (title) showForegroundToast(title, body, payload.data || {});
  });
}

// ── Shared helpers ────────────────────────────────────────────────────────────

async function saveFcmToken(token) {
  await api.patch('/auth/me/fcm-token', { token }).catch(() => {});
}

function routeTopic(from, to) {
  const f = from.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const t = to.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `route_${f}_${t}`;
}

function showForegroundToast(title, body, data = {}) {
  import('react-hot-toast').then(({ default: toast }) => {
    const message = body ? `${title}\n${body}` : title;
    toast(message, {
      duration: 6000,
      icon: notifIcon(data.type),
      style: { cursor: 'pointer' },
      onClick: () => navigateFromData(data),
    });
  });
}

function notifIcon(type) {
  switch (type) {
    case 'message':         return '💬';
    case 'parcel_accepted': return '🎉';
    case 'parcel_request':  return '📦';
    case 'new_trip':        return '✈️';
    case 'delivered':       return '✅';
    default:                return '🕊️';
  }
}

function navigateFromData(data = {}) {
  const screen = data.screen || screenFor(data.type, data);
  if (screen && screen !== window.location.pathname) {
    window.location.href = screen;
  }
}

function screenFor(type, data = {}) {
  switch (type) {
    case 'message':         return data.senderId ? `/chat/${data.senderId}` : '/messages';
    case 'parcel_accepted':
    case 'delivered':
    case 'parcel_request':  return '/my-parcels';
    case 'new_trip':        return '/trips';
    default:                return '/';
  }
}
