export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration) {
      registration.showNotification(title, {
        icon: "/icons/icon-192x192.png", // Assuming PWA icons exist
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        ...options,
      } as any);
      return;
    }
  }

  // Fallback if Service Worker isn't registered (e.g. dev mode)
  new Notification(title, {
    icon: "/icons/icon-192x192.png",
    ...options,
  });
}
