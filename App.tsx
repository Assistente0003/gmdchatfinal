
import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { Dashboard } from './components/Dashboard'; 
import { InstallModal } from './components/InstallModal';
import { ViewState } from './types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

function App() {
  const [view, setView] = useState<ViewState>('login');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [initializing, setInitializing] = useState(true); // Estado de inicialização
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // --- VÁLVULA DE SEGURANÇA ---
  // Se o Supabase demorar mais de 2.5 segundos, forçamos a abertura do App.
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing((current) => {
        if (current) {
          console.warn("Forçando inicialização por timeout...");
          return false;
        }
        return false;
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('gmd-theme');
    const initialDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDarkMode(initialDark);
    applyTheme(initialDark);
  }, []);

  const applyTheme = (isDark: boolean) => {
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#050505');
    } else {
        html.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f3f4f6');
    }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    applyTheme(newMode);
    localStorage.setItem('gmd-theme', newMode ? 'dark' : 'light');
  };

  const fetchProfile = async (userId: string) => {
    try {
      // maybeSingle evita erro se não encontrar (retorna null em vez de exception)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  const updateLastSeen = async (userId: string) => {
    try {
        await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
        // Silencioso
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
                throw error;
            }
            
            if (mounted) {
                if (data?.session) {
                    setSession(data.session);
                    if (data.session.user) {
                        // Não esperamos o perfil carregar para liberar a UI
                        fetchProfile(data.session.user.id); 
                        updateLastSeen(data.session.user.id);
                    }
                }
            }
        } catch (error: any) {
            console.error("Erro na inicialização da sessão:", error.message || error);
            
            // Tratamento robusto para Refresh Token inválido
            const msg = error?.message || '';
            if (msg.includes('Refresh Token') || msg.includes('Not Found') || msg.includes('JWT')) {
                console.warn("Token inválido detectado. Limpando sessão.");
                
                // Limpa storage manualmente para garantir
                localStorage.removeItem('gmd-auth-token');
                
                await supabase.auth.signOut().catch(() => {});
                
                if (mounted) {
                    setSession(null);
                    setProfile(null);
                }
            }
        } finally {
            if (mounted) setInitializing(false);
        }
    };
    
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (event === 'SIGNED_OUT') {
            setSession(null);
            setProfile(null);
            // Limpa o cache se fizer logout explícito
            if (event === 'SIGNED_OUT') {
               localStorage.removeItem('gmd-auth-token');
            }
        } else if (session) {
            setSession(session);
            if (session.user) {
                fetchProfile(session.user.id);
                updateLastSeen(session.user.id);
            }
        }
        setInitializing(false);
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      updateLastSeen(session.user.id);
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('gmd-auth-token'); // Limpeza extra
    setProfile(null);
    setSession(null);
  };

  // --- TELA DE CARREGAMENTO INICIAL (SILENCIOSA/MINIMALISTA) ---
  if (initializing) {
    return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
            <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
    );
  }

  // --- SE ESTIVER LOGADO: Renderiza Dashboard ---
  if (session) {
    return (
      <Dashboard 
        user={session.user} 
        profile={profile} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  // --- SE NÃO ESTIVER LOGADO: Telas de Autenticação ---
  const renderAuthContent = () => {
    switch (view) {
      case 'register':
        return <RegisterForm onSwitch={() => setView('login')} />;
      case 'forgot_password':
        return <ForgotPasswordForm onBack={() => setView('login')} />;
      case 'login':
      default:
        return (
          <LoginForm 
            onSwitch={() => setView('register')} 
            onForgotPassword={() => setView('forgot_password')} 
            onInstallClick={handleInstallClick} 
          />
        );
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white relative overflow-hidden flex flex-col">
      <InstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 py-10">
          <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col justify-center">
            <Logo />
            <div className="transition-all duration-500 ease-in-out">
              {renderAuthContent()}
            </div>
            <div className="mt-8 sm:mt-12 text-center text-xs text-gray-800 pb-safe-bottom">
              © {new Date().getFullYear()} GMD chat. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
