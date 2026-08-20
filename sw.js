// Transcript Tracker — Service Worker
// Enables PWA installation on iOS and Windows

const CACHE_NAME = 'transcript-tracker-v3';
const STATIC_URLS = ['/index.html', '/manifest.json', '/sw.js'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_URLS).catch(() => {}))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = event.request.url;

    // Always go network-first for Supabase API calls
    if (url.includes('supabase.co') || url.includes('supabase.io')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Network-first with cache fallback for everything else
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
