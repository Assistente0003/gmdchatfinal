
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE (PREENCHIDA AUTOMATICAMENTE)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCtBzvCGG5KLwL8lYvr3ZIXdjtEx8vGOog",
  authDomain: "gmd-chat-bcf8f.firebaseapp.com",
  projectId: "gmd-chat-bcf8f",
  storageBucket: "gmd-chat-bcf8f.appspot.com",
  messagingSenderId: "58582418554",
  appId: "1:58582418554:web:fbc8aef065a8073b8937c3"
};

// ============================================================================
// ⚠️ PASSO FINAL: CHAVE VAPID ⚠️
// Chave pública para autenticação do Push no navegador
// ============================================================================
export const VAPID_KEY: string = "BCjorZfGg4YKxBMPHCLVN9CXet_smf0NwR-72YmDFYtjOag3hdfI4G33Iox66HYZQsZLO3LheNZJAxjExNTeq6k"; 

// ----------------------------------------------------------------------------
// Inicialização
// ----------------------------------------------------------------------------

let messaging: any = null;

try {
    if (typeof window !== 'undefined') {
        const app = initializeApp(firebaseConfig);
        
        // Verifica se o navegador suporta Service Workers antes de iniciar
        // e se não estamos em um ambiente restrito (como iframes de preview)
        if ('serviceWorker' in navigator) {
            messaging = getMessaging(app);
        }
    }
} catch (error: any) {
    // Ignora erros conhecidos de ambiente de desenvolvimento/preview
    if (error?.code === 'messaging/failed-serviceworker-registration' || 
        error?.message?.includes('Service messaging is not available')) {
        console.warn("FCM: Notificações desativadas no modo Preview. Funcionarão em Produção (Vercel).");
    } else {
        console.warn("Erro ao inicializar Firebase:", error);
    }
}

export { messaging, getToken, onMessage };
