
const CACHE_NAME = 'gmd-chat-v31-force-update'; // Versão agressiva para forçar atualização
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW a ativar imediatamente, ignorando a espera
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Assume o controle de todas as abas imediatamente
  );
});

// Interceptação de Requests (Network First, Cache Fallback for HTML)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de API/Supabase/Firebase para não cachear dados dinâmicos
  if (event.request.url.includes('supabase.co') || event.request.url.includes('firebase')) {
      return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// --- RECEBIMENTO DE NOTIFICAÇÃO PUSH (FCM) ---
self.addEventListener('push', function(event) {
  if (event.data) {
    const payload = event.data.json();
    
    // Suporte híbrido: Tenta pegar de 'notification' ou de 'data' (Mais robusto)
    const data = payload.data || {};
    const notification = payload.notification || {};

    const title = notification.title || data.title || 'GMD Chat';
    const body = notification.body || data.body || 'Nova mensagem recebida.';
    const icon = 'https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png';

    const options = {
      body: body,
      icon: icon,
      badge: icon, // Ícone pequeno na barra de status (Android)
      vibrate: [200, 100, 200],
      tag: 'gmd-chat-msg', // Agrupa notificações
      renotify: true, // Vibra novamente se chegar nova msg na mesma tag
      data: {
        url: data.url || '/',
        senderId: data.senderId
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir Conversa'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
    
    // Tenta atualizar o Badge do ícone do App (Contador)
    if ('setAppBadge' in self.navigator) {
        // Incrementa ou define um valor genérico (1) pois o SW não sabe o total exato sem consultar o banco
        self.navigator.setAppBadge(1).catch(e => console.log(e));
    }
  }
});

// Clique na Notificação - Comportamento Nativo (WhatsApp)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Limpa o Badge ao clicar
  if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge().catch(e => console.log(e));
  }

  // Tenta abrir a URL específica ou focar na janela existente
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Tenta focar em uma aba já aberta
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          // Se tiver suporte a postMessage, avisa a aba para abrir o chat específico
          if (event.notification.data?.senderId) {
             client.postMessage({
               type: 'OPEN_CHAT',
               senderId: event.notification.data.senderId
             });
          }
          return client.focus();
        }
      }
      // 2. Se não tiver aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
