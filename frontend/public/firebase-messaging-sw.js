// Firebase Cloud Messaging service worker
// Handles background/closed-tab push notifications on web
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyC9fnVTFke-eWlDWYi1rDRjuQu7z2vUxwo',
  authDomain:        'kabootar-9174c.firebaseapp.com',
  projectId:         'kabootar-9174c',
  storageBucket:     'kabootar-9174c.firebasestorage.app',
  messagingSenderId: '705500228139',
  appId:             '1:705500228139:web:fb6adfcee0ceb3c50ad86e',
});

const messaging = firebase.messaging();

// Derive the deep-link path from notification data
function screenFor(data) {
  if (data.screen) return data.screen;
  switch (data.type) {
    case 'message':         return data.senderId ? `/chat/${data.senderId}` : '/messages';
    case 'parcel_accepted':
    case 'delivered':
    case 'parcel_request':  return '/my-parcels';
    case 'new_trip':        return '/trips';
    default:                return '/';
  }
}

// Background notification — app is closed or tab is not focused
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;

  const data   = payload.data || {};
  const screen = screenFor(data);

  const icons = {
    message:         '/icons/chat.png',
    parcel_accepted: '/icons/parcel.png',
    parcel_request:  '/icons/parcel.png',
    new_trip:        '/icons/trip.png',
    delivered:       '/icons/check.png',
  };

  self.registration.showNotification(title, {
    body,
    icon:  '/logo.png',
    badge: '/logo.png',
    image: icons[data.type] || undefined,
    vibrate: [200, 100, 200],
    tag:   data.type || 'kabutar',           // groups same-type notifications
    renotify: true,
    data:  { screen, ...data },
  });
});

// Notification click → open/focus the app at the right screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const screen = event.notification.data?.screen || '/';
  const url    = `https://app.kabutar.in${screen}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      // Focus existing tab if already open
      const existing = cs.find(c => c.url.startsWith('https://app.kabutar.in'));
      if (existing) {
        existing.focus();
        return existing.navigate(url);
      }
      return clients.openWindow(url);
    })
  );
});
