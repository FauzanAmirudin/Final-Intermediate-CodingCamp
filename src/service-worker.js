const CACHE_NAME = "football-app-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";

// Application Shell files to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles/main.css",
  "/scripts/app.js",
  "/scripts/db.js",
  "/scripts/push.js",
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Add to dynamic cache
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  let notificationData;
  try {
    // Parse the notification data according to the API schema
    const data = event.data.json();
    notificationData = {
      title: data.title || "Story App Notification",
      body: data.options?.body || "New update available",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: {
        dateOfArrival: Date.now(),
        url: "/",
      },
    };
  } catch (e) {
    // Fallback for plain text notifications
    notificationData = {
      title: "Story App Notification",
      body: event.data.text(),
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: {
        dateOfArrival: Date.now(),
        url: "/",
      },
    };
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      {
        action: "explore",
        title: "View Details",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png",
      },
    ],
    requireInteraction: true,
    tag: "story-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, options)
      .catch((error) => {
        console.error("Error showing notification:", error);
      })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "explore") {
    // Get the URL from notification data
    const urlToOpen = event.notification.data.url || "/";

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          // If a window tab is already open, focus it
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          // If no window tab is already open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Handle push subscription change
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription
          ? event.oldSubscription.options.applicationServerKey
          : null,
      })
      .then((subscription) => {
        // Send the new subscription to the server
        return fetch(`${CONFIG.API_BASE_URL}/push/resubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldSubscription: event.oldSubscription,
            newSubscription: subscription,
          }),
        });
      })
      .catch((error) => {
        console.error("Error handling subscription change:", error);
      })
  );
});
