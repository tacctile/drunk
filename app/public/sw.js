/* Hoppz service worker — minimal offline shell.
   - Cache-first for the static app shell (CSS/JS/fonts).
   - Network-first for live data (supabase.co, googleapis.com).
   - Navigations fall back to /offline.html when the network is gone and
     nothing is cached.
   The cache name is bumped to invalidate the whole shell on release. */
// VAPID_PUBLIC_KEY is injected at build time via next.config.mjs
// See .env.example for setup instructions
const CACHE = "hoppz-v1";

// Precached so the offline fallback is always available, even cold.
const PRECACHE = ["/offline.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Try the network, fall back to whatever's cached for this request. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (request.method === "GET" && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

/** Serve from cache, populating it from the network on a miss. */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (request.method === "GET" && response.ok) cache.put(request, response.clone());
  return response;
}

/** Network-first navigations, with /offline.html as the last resort. */
async function handleNavigation(request) {
  try {
    return await networkFirst(request);
  } catch (err) {
    const cache = await caches.open(CACHE);
    return (await cache.match("/offline.html")) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Full-page navigations: network-first so auth redirects and fresh content
  // always win, with /offline.html as the last resort.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Google Fonts are immutable once published — cache them hard.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Live data: always reach for the network first, fall back to cache.
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("googleapis.com")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed, immutable build assets (CSS/JS/fonts) and our static icons/
  // manifest — safe to serve cache-first.
  const sameOrigin = url.origin === self.location.origin;
  const immutable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json";
  if (sameOrigin && immutable) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (RSC payloads, data fetches, third parties): network-first
  // so client-side navigations never go stale, cache only as an offline net.
  event.respondWith(networkFirst(request));
});

// ---------------------------------------------------------------------------
// PUSH NOTIFICATION HANDLER
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Hoppz", body: event.data.text() };
  }

  const title = payload.title ?? "Hoppz";
  const options = {
    body: payload.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag ?? "hoppz-default",
    renotify: payload.renotify ?? false,
    data: {
      url: payload.url ?? "/social",
      ...payload.data,
    },
    actions: payload.actions ?? [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/social";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
