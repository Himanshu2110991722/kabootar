// Firebase Cloud Messaging service worker — handles background push notifications on web
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

// Handle background notifications (app is closed / in background on web)
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body:  body || '',
    icon:  '/logo.png',
    badge: '/logo.png',
    data:  payload.data || {},
    vibrate: [200, 100, 200],
  });
});

// Clicking the notification opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = 'https://app.kabutar.in';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const existing = cs.find(c => c.url.startsWith(url));
      return existing ? existing.focus() : clients.openWindow(url);
    })
  );
});
