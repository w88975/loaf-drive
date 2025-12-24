/**
 * GeekDrive Service Worker
 * 缓存策略：
 * - 应用 Shell（HTML/JS/CSS）: Cache First
 * - 静态资源（字体/图片）: Cache First
 * - API 请求: Network First
 */

const CACHE_NAME = 'geekdrive-v1';
const RUNTIME_CACHE = 'geekdrive-runtime-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/fonts/inter-var.woff2',
  '/fonts/jetbrains-mono-var.woff2',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch 事件 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 HTTP(S) 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 跳过 API 请求的缓存（让其走 Network First）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源使用 Cache First 策略
  event.respondWith(cacheFirst(request));
});

/**
 * Cache First 策略
 * 优先从缓存读取，缓存未命中时从网络获取并缓存
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  console.log('[SW] Cache miss, fetching:', request.url);
  try {
    const response = await fetch(request);
    
    // 只缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // 如果是导航请求，返回离线页面
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    
    throw error;
  }
}

/**
 * Network First 策略
 * 优先从网络获取，网络失败时使用缓存
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    
    // 缓存成功的响应
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

/**
 * 消息处理
 * 支持从主线程发送消息控制 SW
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

