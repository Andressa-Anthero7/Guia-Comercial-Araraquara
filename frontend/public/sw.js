self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Guia Comercial Araraquara", {
      body: data.body || "Existe uma nova atualizacao no Backoffice.",
      icon: data.icon || "/assets/brand-logo.png",
      badge: "/assets/brand-logo.png",
      tag: data.tag || "backoffice-notification",
      data: { url: data.url || "/backoffice" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/backoffice", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return clients.openWindow(target);
    })
  );
});
