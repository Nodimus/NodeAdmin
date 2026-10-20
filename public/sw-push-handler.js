// sw-push-handler.js
// Manipulador oficial de eventos de Web Push e clique em notificações (Prompt 15)

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Optoclin - Gestão Optométrica';
    const options = {
      body: payload.body || 'Atualização na agenda do consultório.',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || 'optoclin-agenda-push',
      data: {
        url: payload.url || '/admin/agenda',
        timestamp: payload.timestamp || Date.now(),
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Erro ao processar evento de push:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/agenda';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
