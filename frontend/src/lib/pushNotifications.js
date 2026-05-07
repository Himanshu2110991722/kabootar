import { Capacitor } from '@capacitor/core';
import api from './api';

// VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web push certificates
// You must generate this in Firebase Console and add it here
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Request push notification permission and register the FCM token with the backend.
 * Call this after the user logs in.
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
    // Push notifications are optional — never crash the app
    console.warn('Push init failed:', err.message);
  }
}

// ── Android (Capacitor) ───────────────────────────────────────────────────────
async function initAndroidPush() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  // Token received → send to backend
  PushNotifications.addListener('registration', async ({ value: token }) => {
    await saveFcmToken(token);
  });

  // Foreground notification (app is open)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    import('react-hot-toast').then(({ default: toast }) => {
      toast(`${notification.title}\n${notification.body}`, { duration: 5000 });
    });
  });

  // User tapped a notification — navigate based on data
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data || {};
    handleNotificationTap(data);
  });
}

// ── Web (Firebase Messaging) ──────────────────────────────────────────────────
async function initWebPush() {
  if (!VAPID_KEY) {
    console.warn('VITE_FIREBASE_VAPID_KEY not set — web push skipped');
    return;
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
  const { default: app } = await import('./firebase');

  const messaging = getMessaging(app);

  const token = await getToken(messaging, { vapidKey: VAPID_KEY }).catch(() => null);
  if (token) await saveFcmToken(token);

  // Foreground message
  onMessage(messaging, (payload) => {
    const { title, body } = payload.notification || {};
    if (!title) return;
    import('react-hot-toast').then(({ default: toast }) => {
      toast(`${title}\n${body}`, { duration: 5000 });
    });
  });
}

// ── Shared helpers ────────────────────────────────────────────────────────────
async function saveFcmToken(token) {
  await api.patch('/auth/me/fcm-token', { token }).catch(() => {});
}

function handleNotificationTap(data) {
  if (data.type === 'message' && data.senderId) {
    window.location.href = `/chat/${data.senderId}`;
  } else if (data.type === 'parcel_accepted' || data.type === 'delivered') {
    window.location.href = '/my-parcels';
  }
}
