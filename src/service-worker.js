import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

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

// Precache and route the assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts-stylesheets",
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images with a cache-first strategy
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache CSS and JS files with a stale-while-revalidate strategy
registerRoute(
  ({ request, url }) =>
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js"),
  new StaleWhileRevalidate({
    cacheName: "static-resources",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache API calls with a network-first strategy
registerRoute(
  ({ url }) => url.origin === "https://story-api.dicoding.dev",
  new NetworkFirst({
    cacheName: "api-responses",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 Day
      }),
    ],
  })
);

// Cache pages with a network-first strategy
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache other origins with a stale-while-revalidate strategy
registerRoute(
  ({ url }) =>
    url.origin === "https://unpkg.com" || url.origin === "https://leaflet.com",
  new StaleWhileRevalidate({
    cacheName: "external-resources",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);

// Fallback for navigation requests
// If a page is not in the cache or network is unavailable, show a fallback page
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html");
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

    // Format according to Dicoding API schema
    notificationData = {
      title: data.title || "Story App Notification",
      options: {
        body: data.options?.body || "New update available",
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
    Promise.all([
      applicationServerKey,
      self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      }),
    ]).then(([key, subscription]) => {
      // Send new subscription to server
      // This is a placeholder as we don't have the actual function here
      console.log("Push subscription changed and renewed");
    })
  );
});
