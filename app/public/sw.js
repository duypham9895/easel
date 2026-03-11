/**
 * Easel PWA Service Worker
 * Handles Web Push notifications for SOS, Whisper, and Cycle alerts.
 */

// Show notification when push event is received
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body, data } = payload;

  const options = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data ?? {},
    tag: data?.type ?? 'easel',
    // Replace existing notification of the same tag
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return clients.openWindow('/');
    })
  );
});

// Activate immediately — don't wait for old SW to stop
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
