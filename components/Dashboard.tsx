
import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Ticket, Video, Trophy, Gift, Home, MessageCircle, User, Crown, Sparkles, PieChart, Gamepad2, Medal, Bell, AlertTriangle
} from 'lucide-react';
import { ChatScreen } from './ChatScreen';
import { ProfileScreen } from './ProfileScreen';
import { ChatWindow } from './ChatWindow';
import { RankingModal } from './RankingModal';
import { DevelopmentModal } from './DevelopmentModal';
import { AdminPerformanceModal } from './AdminPerformanceModal'; 
import { AssistantPerformanceModal } from './AssistantPerformanceModal';
import { BuyAssetsModal } from './BuyAssetsModal';
import { PromoterPerformanceModal } from './PromoterPerformanceModal'; 
import { NotificationToast } from './NotificationToast';
import { ReferralModal } from './ReferralModal';
import { NewsModal } from './NewsModal';
import { ParticleBackground } from './ParticleBackground';
import { supabase } from '../lib/supabase';
import { playNotificationSound } from '../lib/sounds';
// Importação do Firebase
import { messaging, getToken, onMessage, VAPID_KEY } from '../lib/firebase';

interface DashboardProps {
  user: any;
  profile: any;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

type TabType = 'home' | 'chat' | 'profile';

export const Dashboard: React.FC<DashboardProps> = ({ user, profile, onLogout, isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeChatContact, setActiveChatContact] = useState<any>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showReferral, setShowReferral] = useState(false); 
  const [topRanking, setTopRanking] = useState<any[]>([]);
  
  const [assistantViewMode, setAssistantViewMode] = useState(false);
  
  const [showAdminPerf, setShowAdminPerf] = useState(false);
  const [showAssistantPerf, setShowAssistantPerf] = useState(false);
  const [showPromoterPerf, setShowPromoterPerf] = useState(false);
  const [showBuyAssets, setShowBuyAssets] = useState(false);
  const [showNews, setShowNews] = useState(false);

  const [showDevModal, setShowDevModal] = useState(false);
  const [devFeatureName, setDevFeatureName] = useState('');
  
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  // Estado da notificação interna (Toast)
  const [notification, setNotification] = useState<{ senderName: string, avatarUrl?: string, content: string, senderId: string, forPromoter?: boolean } | null>(null);

  // Refs para garantir acesso ao valor mais atual dentro do listener do Supabase
  const activeChatContactRef = useRef(activeChatContact);
  const profileCache = useRef<Map<string, { full_name: string, avatar_url: string }>>(new Map());

  const safeProfile = profile || { role: 'user', full_name: 'Usuário' };
  const displayName = safeProfile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const role = safeProfile.role || 'user';
  const isAdmin = role === 'admin';
  const isPromoter = role === 'promoter';
  const isAssistant = role === 'assistant';

  const roleBadgeConfig: Record<string, { label: string, bg: string, text: string, border: string }> = {
    admin: { label: 'ADMIN', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
    promoter: { label: 'PROMOTOR', bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
    assistant: { label: 'ASSISTENTE', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    user: { label: 'USUÁRIO', bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
  };
  const currentBadge = roleBadgeConfig[role] || roleBadgeConfig['user'];
  
  const logoUrl = "https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png";

  // Mantenha a Ref atualizada sempre que o chat ativo mudar
  useEffect(() => {
    activeChatContactRef.current = activeChatContact;
  }, [activeChatContact]);

  // --- CONFIGURAÇÃO DO FCM (FIREBASE CLOUD MESSAGING) ---
  useEffect(() => {
    if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
    }

    const initFCM = async () => {
        try {
            if (typeof window !== 'undefined' && 'Notification' in window && messaging) {
                const permission = await Notification.requestPermission();
                setPermissionStatus(permission);
                
                if (permission === 'granted') {
                    // Verifica se a VAPID KEY foi configurada
                    if (VAPID_KEY === "SUA_CHAVE_VAPID_LONGA_AQUI") {
                        console.warn("FCM: VAPID KEY não configurada em lib/firebase.ts");
                        return;
                    }

                    const token = await getToken(messaging, { 
                        vapidKey: VAPID_KEY
                    });
                    
                    if (token) {
                        console.log('✅ FCM Token Gerado:', token);
                        setFcmToken(token);
                        setFcmError(null);
                        
                        // Atualiza o token no perfil do usuário no Supabase
                        // Adicionamos catch para não quebrar se a coluna fcm_token não existir no banco
                        await supabase.from('profiles').update({ 
                            fcm_token: token 
                        }).eq('id', user.id).catch(err => {
                            console.warn("Aviso: Não foi possível salvar o Token FCM no banco. Verifique se a coluna 'fcm_token' existe na tabela 'profiles'.", err);
                        });
                        
                    } else {
                        console.warn('FCM: Nenhum token de registro disponível.');
                    }
                } else {
                    console.warn('FCM: Permissão de notificação negada.');
                    setFcmError('Permissão negada');
                }
            }
        } catch (error: any) {
            console.error("Erro ao configurar FCM:", error);
            if (error.code === 'messaging/invalid-vapid-key') {
                setFcmError('VAPID Key Inválida');
            } else {
                setFcmError(error.message || 'Erro FCM');
            }
        }
    };

    // Pequeno delay para garantir que o SW esteja pronto
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            initFCM();
        });
    }

    // Listener para mensagens recebidas enquanto o app está ABERTO (Foreground)
    if (messaging) {
        onMessage(messaging, (payload) => {
            console.log('Mensagem FCM recebida no foreground:', payload);
            playNotificationSound();
            setNotification({
                senderName: payload.notification?.title || 'Nova Mensagem',
                content: payload.notification?.body || 'Conteúdo oculto',
                avatarUrl: logoUrl,
                senderId: 'fcm',
            });
        });
    }

  }, [user.id]);

  // Busca Ranking
  useEffect(() => {
    if (activeTab === 'home') {
      const fetchTop3 = async () => {
        if (topRanking.length > 0) return;
        const { data } = await supabase
          .from('weekly_ranking')
          .select('*')
          .order('score', { ascending: false })
          .limit(3);
        if (data) setTopRanking(data);
      };
      fetchTop3();
    }
  }, [activeTab]);

  // --- FUNÇÃO AUXILIAR PARA NOTIFICAÇÃO NATIVA (SISTEMA) ---
  // Fallback se o FCM não estiver configurado
  const sendSystemNotification = (title: string, body: string, icon?: string) => {
    if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: icon || logoUrl,
                    badge: logoUrl, 
                    vibrate: [200, 100, 200],
                    tag: 'gmd-chat-msg',
                    data: { url: window.location.href }
                } as any);
            });
        }
    }
  };

  // --- SISTEMA DE NOTIFICAÇÃO REALTIME (SUPABASE) ---
  useEffect(() => {
    if (!user) return;

    const myId = user.id;
    const promoterId = (isAssistant && safeProfile.parent_id) ? safeProfile.parent_id : null;

    // Função que processa a nova mensagem
    const handleNewMessage = async (payload: any) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === myId) return;

        const currentContact = activeChatContactRef.current;
        const currentChatId = currentContact?.contact_id || currentContact?.id;

        if (currentChatId === newMsg.sender_id && document.visibilityState === 'visible') {
            return;
        }

        playNotificationSound();

        try {
            let senderData = profileCache.current.get(newMsg.sender_id);

            if (!senderData) {
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', newMsg.sender_id)
                    .single();
                
                if (senderProfile) {
                    senderData = {
                        full_name: senderProfile.full_name,
                        avatar_url: senderProfile.avatar_url
                    };
                    profileCache.current.set(newMsg.sender_id, senderData);
                }
            }

            const contentText = newMsg.type === 'image' ? '📷 Imagem' : newMsg.type === 'audio' ? '🎤 Áudio' : newMsg.content;
            const displayName = senderData?.full_name || 'Novo Usuário';

            setNotification({
                senderName: displayName,
                avatarUrl: senderData?.avatar_url,
                content: contentText,
                senderId: newMsg.sender_id,
                forPromoter: newMsg.receiver_id === promoterId
            });

            // Se FCM não estiver ativo, usa o fallback local
            sendSystemNotification(displayName, contentText, senderData?.avatar_url);

        } catch (err) {
            console.error("Erro notificação:", err);
        }
    };

    const handleNewNews = (payload: any) => {
        const newItem = payload.new;
        playNotificationSound();
        const title = 'Nova Novidade!';
        
        setNotification({
            senderName: title,
            avatarUrl: logoUrl,
            content: newItem.title,
            senderId: 'news',
            forPromoter: false
        });

        sendSystemNotification(title, newItem.title, logoUrl);
    };

    const channel = supabase.channel(`global_notifications:${user.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` }, handleNewMessage)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, handleNewNews);

    if (promoterId) {
        channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${promoterId}` }, handleNewMessage);
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, isAssistant, safeProfile.parent_id]);

  const handleNotificationClick = async () => {
      if (!notification) return;
      const targetId = notification.senderId;
      const isForPromoter = notification.forPromoter;
      
      setNotification(null); 

      if (targetId === 'news') {
          setShowNews(true);
          return;
      }
      if (targetId === 'fcm') {
          return; // Apenas fecha
      }

      if (isForPromoter) {
          setAssistantViewMode(true);
      } else {
          setAssistantViewMode(false);
      }

      const { data: contactProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
        
      if (contactProfile) {
          setActiveTab('chat');
          setActiveChatContact({
              id: contactProfile.id,
              contact_id: contactProfile.id,
              full_name: contactProfile.full_name,
              avatar_url: contactProfile.avatar_url,
              account_id: contactProfile.account_id,
              role: contactProfile.role,
              last_seen: contactProfile.last_seen,
              acting_sender_id: isForPromoter ? safeProfile.parent_id : undefined 
          });
      }
  };

  const handleFeatureClick = (name: string) => {
    setDevFeatureName(name);
    setShowDevModal(true);
  };

  // TESTE DE NOTIFICAÇÃO LOCAL
  const testLocalNotification = async () => {
      if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          setPermissionStatus(perm);
          
          if (perm === 'granted') {
              if ('serviceWorker' in navigator) {
                  const reg = await navigator.serviceWorker.ready;
                  reg.showNotification('Teste de Notificação', {
                      body: 'Se você viu isso, seu dispositivo pode receber alertas!',
                      icon: logoUrl,
                      vibrate: [200, 100, 200]
                  } as any);
              } else {
                  new Notification('Teste de Notificação', {
                      body: 'Se você viu isso, seu navegador permite alertas!',
                      icon: logoUrl
                  });
              }
          } else {
              alert("Permissão negada. Verifique as configurações do navegador.");
          }
      } else {
          alert("Navegador não suporta notificações.");
      }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatScreen 
            currentUserProfile={safeProfile}
            currentUserId={user.id}
            onSelectContact={(contact) => setActiveChatContact(contact)}
            viewingAsPromoter={assistantViewMode}
            onToggleViewMode={setAssistantViewMode}
          />
        );
      case 'profile':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <ProfileScreen 
                user={user} 
                profile={safeProfile} 
                onLogout={onLogout}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
            />
          </div>
        );
      case 'home':
      default:
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pb-safe-bottom">
             <div className="animate-fade-in max-w-2xl mx-auto w-full pb-32 pt-2 px-4">
                
                {/* STATUS DE PUSH / BOTÃO DE TESTE */}
                {fcmError ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={16} />
                        <div className="flex-1">
                            <p className="text-red-500 text-xs font-bold">Erro de Configuração Push</p>
                            <p className="text-red-400 text-[10px]">{fcmError} - Verifique lib/firebase.ts</p>
                        </div>
                    </div>
                ) : (
                    <div className={`rounded-xl p-3 mb-4 flex items-center gap-3 border ${permissionStatus === 'granted' ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                        <Bell size={18} className={permissionStatus === 'granted' ? 'text-green-500' : 'text-yellow-500'} />
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${permissionStatus === 'granted' ? 'text-green-500' : 'text-yellow-500'}`}>
                                Notificações: {permissionStatus === 'granted' ? 'Ativadas' : 'Pendentes'}
                            </p>
                            {fcmToken ? (
                                <p className="text-green-400 text-[10px] truncate w-full cursor-pointer" onClick={() => { navigator.clipboard.writeText(fcmToken); alert("Token copiado!"); }}>
                                    Token Ativo (Toque para copiar)
                                </p>
                            ) : (
                                <p className="text-yellow-500/70 text-[10px]">Aguardando token...</p>
                            )}
                        </div>
                        <button 
                            onClick={testLocalNotification}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                        >
                            Testar Push
                        </button>
                    </div>
                )}

                <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-xl transition-all">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Bem-vindo de volta</p>
                            <h1 className="text-2xl font-bold text-white tracking-tight truncate max-w-[200px]">
                                {displayName}
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            {isAdmin && (
                                <button onClick={() => setShowAdminPerf(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-all border border-yellow-500/20 shadow-lg">
                                    <PieChart size={20} />
                                </button>
                            )}
                            {isAssistant && (
                                <button onClick={() => setShowAssistantPerf(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-lg">
                                    <PieChart size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 relative z-10">
                        {['Sinais', 'Rifas', 'Live', 'Jogos'].map((feat, idx) => {
                            const icons = [LineChart, Ticket, Video, Gamepad2];
                            const colors = ['text-green-500', 'text-yellow-500', 'text-red-500', 'text-blue-500'];
                            const bgColors = [
                                'bg-green-500/5 border-green-500/20 hover:bg-green-500/20', 
                                'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/20', 
                                'bg-red-500/5 border-red-500/20 hover:bg-red-500/20', 
                                'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/20'
                            ];
                            const Icon = icons[idx];
                            
                            return (
                                <div 
                                key={feat}
                                onClick={() => handleFeatureClick(feat)}
                                className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
                                >
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all backdrop-blur-sm ${bgColors[idx]}`}>
                                    <Icon size={20} className={colors[idx]} />
                                </div>
                                <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 group-hover:text-white transition-colors">{feat}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isPromoter && (
                    <button 
                    onClick={() => setShowReferral(true)}
                    className="w-full mt-6 relative overflow-hidden group rounded-2xl active:scale-[0.98] transition-transform shadow-lg border border-orange-500/30"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-[#1a1005]/80 to-black/80 backdrop-blur-sm"></div>
                        <div className="relative z-10 flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/10">
                                    <Gift size={24} className="drop-shadow-md" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                                        INDIQUE E GANHE
                                        <span className="text-[9px] bg-orange-600/90 text-white px-2 py-0.5 rounded-full font-extrabold border border-orange-400/20 shadow-sm">R$10</span>
                                    </h3>
                                    <p className="text-gray-400 text-[11px] mt-0.5 font-medium">Receba bônus por cada novo promotor.</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-colors">
                                <div className="border-t-2 border-r-2 border-current w-2 h-2 rotate-45 -ml-1"></div>
                            </div>
                        </div>
                    </button>
                )}

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ranking Semanal</h2>
                        </div>
                        <button 
                        onClick={() => setShowRanking(true)}
                        className="text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full hover:bg-orange-500/20 transition-all active:scale-95 backdrop-blur-sm"
                        >
                        VER TODOS
                        </button>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-lg">
                        {topRanking.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Crown size={20} className="text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500 font-medium">Ranking atualizando...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {topRanking.map((item, index) => {
                                    let color = 'text-gray-400';
                                    if (index === 0) color = 'text-yellow-500';
                                    if (index === 1) color = 'text-gray-300';
                                    if (index === 2) color = 'text-amber-600';

                                    return (
                                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="w-6 flex justify-center">
                                                <Medal size={18} className={color} />
                                            </div>
                                            <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                                {item.avatar_url ? (
                                                    <img src={item.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Crown size={14} className="text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-200 text-xs font-bold truncate">{item.full_name}</p>
                                            </div>
                                            <div className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                                                {item.score}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                
                <p className="text-center text-white/20 text-[10px] mt-10 font-medium tracking-wide uppercase">
                    GMD chat
                </p>
            </div>
          </div>
        );
    }
  };

  if (activeChatContact) {
    return (
        <ChatWindow 
            currentUser={user}
            currentUserProfile={safeProfile}
            contact={activeChatContact}
            onBack={() => setActiveChatContact(null)}
            actingSenderId={activeChatContact.acting_sender_id}
        />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#050505] text-white overflow-hidden font-sans relative">
      <ParticleBackground />

      <NotificationToast 
        data={notification} 
        onClose={() => setNotification(null)}
        onClick={handleNotificationClick}
      />

      <NewsModal isOpen={showNews} onClose={() => setShowNews(false)} />
      <BuyAssetsModal isOpen={showBuyAssets} onClose={() => setShowBuyAssets(false)} />
      <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} />
      <ReferralModal isOpen={showReferral} onClose={() => setShowReferral(false)} currentUser={user} profile={safeProfile} /> 
      <DevelopmentModal isOpen={showDevModal} onClose={() => setShowDevModal(false)} featureName={devFeatureName} />
      
      <PromoterPerformanceModal isOpen={showPromoterPerf} onClose={() => setShowPromoterPerf(false)} onOpenBuyAssets={() => setShowBuyAssets(true)} />
      <AdminPerformanceModal isOpen={showAdminPerf} onClose={() => setShowAdminPerf(false)} />
      <AssistantPerformanceModal isOpen={showAssistantPerf} onClose={() => setShowAssistantPerf(false)} />
      
      {/* HEADER */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center justify-between shrink-0 max-w-2xl mx-auto w-full z-10 sticky top-0 bg-black/10 backdrop-blur-md border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-black/50 border border-yellow-500/30 flex items-center justify-center shadow-lg overflow-hidden active:scale-95 transition-transform backdrop-blur-sm">
            <img src={logoUrl} alt="GMD" className="w-full h-full object-contain" />
        </div>

        <button 
            onClick={() => setShowNews(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 rounded-full transition-all active:scale-95 group backdrop-blur-sm"
        >
            <Sparkles size={12} className="text-orange-500 group-hover:animate-spin-slow" />
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Novidades</span>
        </button>

        <div className={`px-3 py-1 rounded-full border ${currentBadge.bg} ${currentBadge.border} flex items-center gap-1.5 shadow-sm backdrop-blur-sm`}>
            <Crown size={10} className={currentBadge.text} fill="currentColor" />
            <span className={`text-[9px] font-extrabold tracking-widest ${currentBadge.text}`}>{currentBadge.label}</span>
        </div>
      </header>

      <main className="flex-1 relative w-full min-h-0 z-10">
        {renderContent()}
      </main>

      {/* NAVIGATION */}
      <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
        <nav className="flex justify-around items-center w-full max-w-xs bg-black/60 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] pointer-events-auto">
          <button 
            onClick={() => setActiveTab('home')}
            className={`p-3 rounded-xl transition-all duration-300 flex-1 flex justify-center ${activeTab === 'home' ? 'bg-white/10 text-orange-500 shadow-sm border border-white/5' : 'text-gray-400 hover:text-gray-200'} active:scale-90`}
          >
            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`p-3 rounded-xl transition-all duration-300 flex-1 flex justify-center ${activeTab === 'chat' ? 'bg-white/10 text-orange-500 shadow-sm border border-white/5' : 'text-gray-400 hover:text-gray-200'} active:scale-90`}
          >
            <div className="relative">
              <MessageCircle size={20} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`p-3 rounded-xl transition-all duration-300 flex-1 flex justify-center ${activeTab === 'profile' ? 'bg-white/10 text-orange-500 shadow-sm border border-white/5' : 'text-gray-400 hover:text-gray-200'} active:scale-90`}
          >
            <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          </button>
        </nav>
      </div>
    </div>
  );
};
