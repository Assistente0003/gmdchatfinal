
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Bell, Copy, LogOut, User, Hash, Briefcase, Crown, UserCog, Camera, ChevronRight, Loader2, Check, Users, Link as LinkIcon, Moon, Sun, PieChart, LineChart, Ticket, Video, Gamepad2 } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { PromoterPanel } from './PromoterPanel';
import { PromoterPerformanceModal } from './PromoterPerformanceModal';
import { BuyAssetsModal } from './BuyAssetsModal';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  user: any;
  profile: any;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, profile, onLogout, isDarkMode, toggleTheme }) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPromoterPanel, setShowPromoterPanel] = useState(false);
  const [showPromoterPerf, setShowPromoterPerf] = useState(false);
  const [showBuyAssets, setShowBuyAssets] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const [promoterData, setPromoterData] = useState<any>(null);
  const [loadingPromoter, setLoadingPromoter] = useState(false);

  // Estado para o carrossel de funcionalidades
  const [featureIndex, setFeatureIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Usuário';
  const email = profile?.email || user?.email;
  const accountId = profile?.account_id || user?.user_metadata?.account_id || '---';
  
  let roleKey = profile?.role || 'user';
  const isAdmin = roleKey === 'admin';
  const isPromoter = roleKey === 'promoter';
  const isAssistant = roleKey === 'assistant';
  
  // Alteração: Permitir que todos os usuários editem o avatar
  const canEditAvatar = true;

  const features = [
    { name: 'Sinais', icon: <LineChart size={18} />, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Rifas', icon: <Ticket size={18} />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { name: 'Live', icon: <Video size={18} />, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Jogos', icon: <Gamepad2 size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notifications_enabled || false);
      if (profile.avatar_url) {
        setAvatarUrl(`${profile.avatar_url}?t=${new Date().getTime()}`);
      }
      if (isAssistant && profile.parent_id) {
        fetchPromoterData(profile.parent_id);
      }
    }
  }, [profile, isAssistant]);

  useEffect(() => {
    // Carrossel de funcionalidades
    const interval = setInterval(() => {
        setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [features.length]);

  const fetchPromoterData = async (parentId: string) => {
    if (promoterData && promoterData.id === parentId) return;

    setLoadingPromoter(true);
    try {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, account_id, avatar_url')
            .eq('id', parentId)
            .single();
        
        if (data) {
            setPromoterData(data);
        }
    } catch (err) {
        console.error('Erro ao buscar promotor:', err);
    } finally {
        setLoadingPromoter(false);
    }
  };

  const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode; border: string }> = {
    user: { 
      label: 'Usuário', 
      color: 'text-gray-300', 
      icon: <User size={14} className="text-gray-400" />,
      border: 'border-gray-500'
    },
    promoter: { 
      label: 'Promotor', 
      color: 'text-yellow-500', 
      icon: <Crown size={14} className="text-yellow-500" />,
      border: 'border-yellow-500'
    },
    assistant: { 
      label: 'Assistente', 
      color: 'text-blue-400', 
      icon: <Briefcase size={14} className="text-blue-400" />,
      border: 'border-blue-500'
    },
    admin: { 
      label: 'Admin', 
      color: 'text-white',
      icon: <Shield size={14} className="text-white" />,
      border: 'border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.4)]'
    }
  };

  const currentRole = roleConfig[roleKey] || roleConfig['user'];

  const handleCopySupportId = () => {
    navigator.clipboard.writeText('102030');
  };

  const handleToggleNotifications = async () => {
    try {
      let newState = !notificationsEnabled;
      if (newState) {
        if (!('Notification' in window)) {
            alert("Este navegador não suporta notificações.");
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Você precisa permitir as notificações no seu navegador para receber alertas.');
          return;
        }
      }
      setNotificationsEnabled(newState);
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_enabled: newState })
        .eq('id', user.id);
      if (error) setNotificationsEnabled(!newState);
    } catch (error) {
      console.error('Erro ao alternar notificações:', error);
    }
  };

  const handleAvatarClick = () => {
    if (canEditAvatar && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      setImageError(false);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para enviar.');
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setAvatarUrl(`${publicUrl}?t=${new Date().getTime()}`);
    } catch (error: any) {
      console.error('Erro upload:', error);
      alert(error.message || 'Erro ao atualizar foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (showAdminPanel) return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  if (showPromoterPanel) return <PromoterPanel onBack={() => setShowPromoterPanel(false)} profile={profile} />;

  const renderAvatarContent = () => {
    if (uploadingAvatar) return <Loader2 className="animate-spin text-gray-500" />;
    if (avatarUrl && !imageError) return <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" onError={() => setImageError(true)} />;
    if (isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black/60 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full border border-yellow-500/20 flex items-center justify-center">
            <span className="text-xl font-bold bg-gradient-to-b from-yellow-300 to-orange-600 bg-clip-text text-transparent">GMD</span>
          </div>
        </div>
      );
    }
    return <span className="text-2xl font-bold text-gray-400">{displayName.charAt(0).toUpperCase()}</span>;
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto animate-fade-in pb-40 px-4">
      
      <BuyAssetsModal isOpen={showBuyAssets} onClose={() => setShowBuyAssets(false)} />
      <PromoterPerformanceModal isOpen={showPromoterPerf} onClose={() => setShowPromoterPerf(false)} onOpenBuyAssets={() => setShowBuyAssets(true)} />

      <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" disabled={!canEditAvatar || uploadingAvatar} />

      {/* HEADER COMPACTO (GLASSMORPHISM) */}
      <div className="flex items-center gap-4 mb-6 pt-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
        <div className={`relative group shrink-0 ${canEditAvatar ? 'cursor-pointer' : ''}`} onClick={handleAvatarClick}>
          <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${roleKey === 'admin' ? 'bg-orange-600' : 'bg-gray-400'}`}></div>
          <div className={`relative w-20 h-20 rounded-full bg-[#121212] border-[2px] ${currentRole.border} flex items-center justify-center overflow-hidden shadow-sm`}>
            {renderAvatarContent()}
            {canEditAvatar && (
              <div className="absolute bottom-1 right-1 bg-[#1a1a1a] rounded-full p-1 border border-orange-500 text-orange-500 z-10">
                <Camera size={10} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate drop-shadow-sm">{displayName}</h2>
            <p className="text-gray-400 text-xs font-medium truncate mb-2">{email}</p>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-white/5 border-white/10`}>
                {currentRole.icon}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentRole.color}`}>{currentRole.label}</span>
            </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO (PROMOTOR) */}
      {isPromoter && (
         <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
                onClick={() => setShowPromoterPerf(true)} 
                className="bg-purple-900/10 border border-purple-500/20 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-purple-900/20 hover:border-purple-500/50 transition-all active:scale-95 group"
            >
                <div className="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
                    <PieChart size={18} className="text-purple-400" />
                </div>
                <span className="text-purple-400 font-bold text-[10px] uppercase">Painel</span>
            </button>

            <button 
                onClick={() => setShowPromoterPanel(true)} 
                className="bg-blue-900/10 border border-blue-500/20 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all active:scale-95 group"
            >
                <div className="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                    <Users size={18} className="text-blue-500" />
                </div>
                <span className="text-blue-500 font-bold text-[10px] uppercase">Equipe</span>
            </button>
         </div>
      )}

      {/* ADMIN */}
      {isAdmin && (
         <button onClick={() => setShowAdminPanel(true)} className="w-full rounded-xl border border-orange-500/20 bg-orange-500/10 backdrop-blur-sm p-3 mb-6 flex items-center gap-3 active:scale-[0.98] transition-all hover:bg-orange-500/20 shadow-md">
            <div className="p-2 rounded-full bg-orange-500/10 text-orange-500">
                <Shield size={18} />
            </div>
            <div className="flex-1 text-left">
                <h3 className="text-orange-500 font-bold text-xs">Painel Administrativo</h3>
            </div>
            <ChevronRight size={16} className="text-orange-400" />
         </button>
      )}

      {/* INFO GRID (GLASS) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        
        {/* ID Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center gap-1.5 mb-1 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <Hash size={12} /> ID da Conta
            </div>
            <span className="text-orange-500 font-mono font-black text-2xl tracking-tight drop-shadow-md">{accountId}</span>
        </div>

        {/* Segundo Slot */}
        {isPromoter && profile?.plan_type ? (
             <div className="bg-yellow-500/5 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1 text-yellow-500 text-[10px] uppercase font-bold">
                    <Crown size={12} /> Plano
                </div>
                <span className="text-yellow-500 font-bold text-sm">{profile.plan_type}</span>
            </div>
        ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Dots indicator */}
                <div className="absolute top-2 right-2 flex gap-1">
                     {features.map((_, idx) => (
                         <div key={idx} className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === featureIndex ? 'bg-orange-500 w-2' : 'bg-gray-800'}`}></div>
                     ))}
                </div>
                
                {/* Animated Content */}
                <div className={`p-2 rounded-full mb-1.5 transition-all duration-500 ${features[featureIndex].bg}`}>
                    {React.cloneElement(features[featureIndex].icon as any, { className: `${features[featureIndex].color} transition-all duration-500` })}
                </div>
                <div className="text-center animate-fade-in">
                    <p className="text-white font-bold text-xs leading-none mb-0.5">{features[featureIndex].name}</p>
                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Em breve</p>
                </div>
            </div>
        )}

        {/* Theme Toggle */}
        <div className="col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 pl-2">
                {isDarkMode ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-orange-500" />}
                <span className="text-gray-300 text-xs font-bold">Tema</span>
            </div>
            <button 
                onClick={toggleTheme}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold text-gray-300 active:scale-95 transition-all"
            >
                {isDarkMode ? 'Escuro' : 'Claro'}
            </button>
        </div>

        {/* Notifications */}
        <div className="col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 pl-2">
            <Bell size={14} className={notificationsEnabled ? "text-green-500" : "text-gray-500"} />
            <span className="text-gray-300 text-xs font-bold">Notificações</span>
          </div>
          <button 
            onClick={handleToggleNotifications}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 active:scale-95 ${
              notificationsEnabled 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-orange-600 text-white shadow-sm'
            }`}
          >
            {notificationsEnabled ? 'Ativado' : 'Ativar'}
          </button>
        </div>
      </div>

      {/* ASSISTANT LINK */}
      {isAssistant && (
         <div className="bg-blue-900/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 border border-blue-500/20">
                {loadingPromoter ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <LinkIcon size={16} className="text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-blue-200 text-xs font-bold uppercase mb-0.5">Vinculado a</p>
                <p className="text-white text-sm font-bold truncate">{promoterData ? promoterData.full_name : 'Carregando...'}</p>
                <p className="text-blue-400 text-[10px] font-mono">#{promoterData?.account_id || '...'}</p>
            </div>
         </div>
      )}

      {/* SUPORTE */}
      {roleKey === 'user' && (
         <div className="bg-yellow-500/5 backdrop-blur-sm border border-yellow-500/20 rounded-xl p-4 mb-6 text-center">
            <p className="text-yellow-500 text-xs font-bold uppercase mb-2">Suporte / Admin</p>
            <div className="flex items-center justify-center gap-2 bg-black/40 rounded-lg p-2 border border-yellow-500/20">
                <span className="font-mono font-bold text-white">102030</span>
                <button onClick={handleCopySupportId} className="text-gray-400 hover:text-orange-500"><Copy size={14} /></button>
            </div>
         </div>
      )}

      <button onClick={onLogout} className="w-full bg-white/5 backdrop-blur-sm border border-white/10 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm mt-auto">
        <LogOut size={16} />
        Sair da Conta
      </button>

      {/* VERSION INDICATOR (FORÇA VERCEL) */}
      <div className="mt-4 text-center">
        <p className="text-[10px] text-gray-700 font-mono">v3.6 LIVE</p>
      </div>

    </div>
  );
};
