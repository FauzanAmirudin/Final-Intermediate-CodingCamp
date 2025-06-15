const CACHE_NAME = "story-app-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";
const API_CACHE = "api-v1";

// Application Shell files to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/bundle.js",
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Precaching App Shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle API requests differently
  if (url.origin === "https://story-api.dicoding.dev") {
    // For API requests, try network first, then cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const clonedResponse = response.clone();

          // Only cache successful responses
          if (response.status === 200) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }

          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request);
        })
    );
  } else {
    // For non-API requests, try cache first, then network
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // If both cache and network fail, return offline fallback
            if (event.request.headers.get("accept").includes("text/html")) {
              return caches.match("/index.html");
            }
          });
      })
    );
  }
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received:", event);

  let notificationData;
  try {
    // Parse the notification data according to the API schema
    const data = event.data.json();
    console.log("[Service Worker] Push data:", data);

    notificationData = {
      title: data.title || "Story App Notification",
      options: {
        body: data.message || "New update available",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        data: {
          dateOfArrival: Date.now(),
          url: data.url || "/",
          primaryKey: 1,
        },
        actions: [
          {
            action: "explore",
            title: "View",
          },
          {
            action: "close",
            title: "Close",
          },
        ],
        vibrate: [100, 50, 100],
        requireInteraction: true,
      },
    };
  } catch (e) {
    console.error("[Service Worker] Error parsing push data:", e);
    // Fallback for plain text notifications
    notificationData = {
      title: "Story App Notification",
      options: {
        body: event.data ? event.data.text() : "New update available",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        data: {
          dateOfArrival: Date.now(),
          url: "/",
          primaryKey: 1,
        },
        actions: [
          {
            action: "explore",
            title: "View",
          },
          {
            action: "close",
            title: "Close",
          },
        ],
        vibrate: [100, 50, 100],
        requireInteraction: true,
      },
    };
  }

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationData.options)
      .then(() => {
        console.log("[Service Worker] Notification shown successfully");
      })
      .catch((error) => {
        console.error("[Service Worker] Error showing notification:", error);
      })
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received");

  event.notification.close();

  const urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  if (event.action === "explore" || !event.action) {
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
  console.log("[Service Worker] Push subscription changed");

  const applicationServerKey = self.registration.pushManager
    .getSubscription()
    .then((subscription) => subscription.options.applicationServerKey);

  event.waitUntil(
    applicationServerKey
      .then((key) => {
        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      })
      .then((newSubscription) => {
        // Here you would send the new subscription to your server
        console.log("[Service Worker] New subscription:", newSubscription);
        return newSubscription;
      })
  );
});
