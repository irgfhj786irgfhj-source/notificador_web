/* global self, clients */
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// Recepción de push
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}

  const title = data.title || 'Aviso';
  const body = data.body || 'Tienes un nuevo aviso.';
  const url = data.url || '/';

  // Nota: No es posible controlar un "sonido personalizado" aquí desde web push.
  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Abrir' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Comportamiento al hacer clic
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
