
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ArrowUpCircle, ArrowDownCircle, Users, Loader2, CheckCircle, AlertCircle, User, Crown, Briefcase, Link as LinkIcon, Sparkles, Server } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PromoterListModal } from './PromoterListModal';
import { AdminNewsManager } from './AdminNewsManager';
import { PushSetupModal } from './PushSetupModal';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [promoteId, setPromoteId] = useState('');
  const [demoteId, setDemoteId] = useState('');
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0); 
  
  // Estados para Indicação Manual
  const [refReferrerId, setRefReferrerId] = useState('');
  const [refTargetId, setRefTargetId] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPromoterList, setShowPromoterList] = useState(false);
  const [showNewsManager, setShowNewsManager] = useState(false);
  const [showPushSetup, setShowPushSetup] = useState(false);

  // Estados para Preview
  const [promotePreview, setPromotePreview] = useState<any>(null);
  const [demotePreview, setDemotePreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<'promote' | 'demote' | null>(null);

  const clearMessage = () => setTimeout(() => setMessage(null), 4000);

  const getPlanDetails = (index: number) => {
    switch (index) {
      case 1: return { name: 'Comercial', limit: 1 };
      case 2: return { name: 'Premium', limit: 5 };
      default: return { name: 'Básico', limit: 0 };
    }
  };

  // Preview Promover
  useEffect(() => {
    const fetchPreview = async (id: string, type: 'promote' | 'demote') => {
      const cleanId = id.replace(/[^0-9]/g, '');
      if (cleanId.length < 3) {
        if (type === 'promote') setPromotePreview(null);
        else setDemotePreview(null);
        return;
      }

      setLoadingPreview(type);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role, account_id, avatar_url, email')
          .eq('account_id', cleanId)
          .maybeSingle();

        if (type === 'promote') setPromotePreview(data);
        else setDemotePreview(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPreview(null);
      }
    };

    const timer = setTimeout(() => {
      if (promoteId) fetchPreview(promoteId, 'promote');
    }, 500);
    return () => clearTimeout(timer);
  }, [promoteId]);

  // Preview Rebaixar
  useEffect(() => {
    const timer = setTimeout(() => {
        const fetchPreview = async () => {
             const cleanId = demoteId.replace(/[^0-9]/g, '');
             if (cleanId.length < 3) {
                setDemotePreview(null);
                return;
             }
             setLoadingPreview('demote');
             try {
                const { data } = await supabase
                  .from('profiles')
                  .select('id, full_name, role, account_id, avatar_url, email')
                  .eq('account_id', cleanId)
                  .maybeSingle();
                setDemotePreview(data);
             } finally {
                setLoadingPreview(null);
             }
        }
        if (demoteId) fetchPreview();
    }, 500);
    return () => clearTimeout(timer);
  }, [demoteId]);


  const handleUpdateRole = async (action: 'promote' | 'demote') => {
    const targetId = action === 'promote' ? promoteId : demoteId;
    if (!targetId) {
      setMessage({ type: 'error', text: 'Por favor, insira um ID.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: users, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name, role, account_id')
        .eq('account_id', targetId);

      if (searchError) throw searchError;

      if (!users || users.length === 0) {
        throw new Error('Usuário não encontrado com este ID da Conta.');
      }

      const user = users[0];
      const newRole = action === 'promote' ? 'promoter' : 'user';

      if (user.role === newRole) {
        throw new Error(`Este usuário já possui o cargo ${newRole === 'promoter' ? 'Promotor' : 'Comum'}.`);
      }

      if (user.role === 'admin') {
        throw new Error('Segurança: Não é permitido alterar o cargo de um Administrador.');
      }

      const planDetails = getPlanDetails(selectedPlanIndex);

      const { error: updateError } = await supabase.rpc('update_profile_role_with_plan', {
        target_account_id: targetId,
        new_role: newRole,
        plan_name: action === 'promote' ? planDetails.name : null,
        assistants_limit: action === 'promote' ? planDetails.limit : 0
      });

      if (updateError) throw updateError;

      const successText = action === 'promote' 
        ? `Sucesso! ${user.full_name} (#${user.account_id}) agora é Promotor (${planDetails.name}).`
        : `Sucesso! ${user.full_name} (#${user.account_id}) foi rebaixado para Usuário Comum.`;

      setMessage({ 
        type: 'success', 
        text: successText
      });
      
      if (action === 'promote') {
        setPromoteId('');
        setPromotePreview(null);
      } else {
        setDemoteId('');
        setDemotePreview(null);
      }

      clearMessage();

    } catch (error: any) {
      console.error(error);
      let errorMsg = 'Erro ao atualizar usuário.';
      
      if (typeof error === 'string') errorMsg = error;
      else if (error?.message) errorMsg = error.message;
      else if (error?.error_description) errorMsg = error.error_description;
      else errorMsg = JSON.stringify(error);

      if (errorMsg.includes('Acesso negado')) {
        errorMsg = 'Apenas Administradores podem realizar essa ação.';
      }

      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterReferral = async () => {
    if (!refReferrerId || !refTargetId) {
        setMessage({ type: 'error', text: 'Preencha os dois IDs.' });
        return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
        const { error } = await supabase.rpc('admin_register_referral', {
            referrer_acc_id: refReferrerId,
            referred_acc_id: refTargetId
        });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Indicação registrada com sucesso!' });
        setRefReferrerId('');
        setRefTargetId('');
        clearMessage();
    } catch (error: any) {
        console.error(error);
        setMessage({ type: 'error', text: error.message || 'Erro ao registrar indicação.' });
    } finally {
        setLoading(false);
    }
  };

  const renderPreviewCard = (user: any, isLoading: boolean) => {
    if (isLoading) return <div className="p-3 text-center"><Loader2 size={16} className="animate-spin text-gray-500 inline" /></div>;
    if (!user) return null;

    const roleColors: any = {
        admin: 'text-orange-500',
        promoter: 'text-yellow-500',
        assistant: 'text-blue-400',
        user: 'text-gray-400'
    };

    return (
        <div className="mt-2 bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-[#222] border border-gray-600 overflow-hidden flex items-center justify-center shrink-0">
                {user.avatar_url ? (
                    <img src={user.avatar_url} className="w-full h-full object-cover" />
                ) : (
                    <User size={18} className="text-gray-500" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{user.full_name}</p>
                <div className={`flex items-center gap-1 text-[10px] uppercase font-bold ${roleColors[user.role] || 'text-gray-500'}`}>
                    {user.role}
                </div>
            </div>
            <div className="bg-black/50 px-2 py-1 rounded text-[10px] text-gray-400 font-mono">
                #{user.account_id}
            </div>
        </div>
    );
  };

  if (showNewsManager) return <AdminNewsManager onClose={() => setShowNewsManager(false)} />;

  return (
    // Overlay Fixo
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col animate-fade-in">
      <PromoterListModal isOpen={showPromoterList} onClose={() => setShowPromoterList(false)} />
      <PushSetupModal isOpen={showPushSetup} onClose={() => setShowPushSetup(false)} />

      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 border-b border-[#1a1a1a] bg-[#050505] shrink-0">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-yellow-500" />
          <h1 className="text-xl font-bold text-white">Administração</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar pb-safe-bottom">
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-500' 
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium break-words w-full">{message.text}</span>
          </div>
        )}

        {/* Card: Configuração de Push (NOVO) */}
        <button 
          onClick={() => setShowPushSetup(true)}
          className="w-full bg-[#111] border border-blue-900/30 hover:border-blue-500/50 p-4 rounded-2xl flex items-center justify-between mb-6 group transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-500">
                    <Server size={20} />
                </div>
                <div className="text-left">
                    <h3 className="text-white font-bold text-sm">Configurar Push Backend</h3>
                    <p className="text-gray-500 text-[10px]">Ativar notificações com app fechado.</p>
                </div>
            </div>
            <ArrowLeft size={18} className="rotate-180 text-gray-600 group-hover:text-blue-500 transition-colors" />
        </button>

        {/* Card: Gerenciar Novidades */}
        <button 
          onClick={() => setShowNewsManager(true)}
          className="w-full bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 hover:border-orange-500/60 p-5 rounded-2xl flex items-center justify-between mb-6 group transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-900/20">
                    <Sparkles size={24} />
                </div>
                <div className="text-left">
                    <h3 className="text-white font-bold text-sm">Postar Novidades</h3>
                    <p className="text-gray-500 text-xs">Atualize o feed de notícias para todos.</p>
                </div>
            </div>
            <ArrowLeft size={20} className="rotate-180 text-gray-500 group-hover:text-white transition-colors" />
        </button>

        {/* Card: Promover */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-5 mb-6 shadow-lg">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <ArrowUpCircle size={14} className="text-yellow-500" />
            Promover Usuário
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 font-medium mb-1.5 block">Plano / Limite</label>
              <select 
                value={selectedPlanIndex}
                onChange={(e) => setSelectedPlanIndex(Number(e.target.value))}
                className="w-full bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 appearance-none"
              >
                <option value={0}>Plano Básico (0 Assistentes)</option>
                <option value={1}>Plano Comercial (1 Assistente)</option>
                <option value={2}>Plano Premium (5 Assistentes)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="ID da Conta (Ex: 123456)"
                value={promoteId}
                onChange={(e) => setPromoteId(e.target.value)}
                className="flex-1 bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-yellow-500/50 placeholder-gray-600"
              />
              <button 
                onClick={() => handleUpdateRole('promote')}
                disabled={loading || !promoteId}
                className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-500 rounded-xl px-4 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUpCircle size={24} />}
              </button>
            </div>
            
            {renderPreviewCard(promotePreview, loadingPreview === 'promote')}
          </div>
        </div>

        {/* Card: Registrar Indicação (NOVO) */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-5 mb-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10"><LinkIcon size={40} /></div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <LinkIcon size={14} className="text-green-500" />
                Registrar Indicação (Manual)
            </h3>
            
            <div className="space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold">Quem Indicou (Promotor):</label>
                    <input 
                        type="text" 
                        placeholder="ID do Indicador"
                        value={refReferrerId}
                        onChange={(e) => setRefReferrerId(e.target.value)}
                        className="bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                </div>
                
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold">Quem Comprou (Cliente):</label>
                    <input 
                        type="text" 
                        placeholder="ID do Cliente"
                        value={refTargetId}
                        onChange={(e) => setRefTargetId(e.target.value)}
                        className="bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-green-500/50 placeholder-gray-600"
                    />
                </div>

                <button 
                    onClick={handleRegisterReferral}
                    disabled={loading || !refReferrerId || !refTargetId}
                    className="w-full bg-green-900/20 hover:bg-green-900/30 border border-green-500/30 text-green-500 font-bold py-3 rounded-xl mt-2 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                    Vincular Indicação
                </button>
            </div>
        </div>

        {/* Card: Rebaixar */}
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-5 mb-8 shadow-lg">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <ArrowDownCircle size={14} className="text-red-500" />
            Rebaixar Promotor
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
                <input 
                type="text" 
                placeholder="ID do Promotor (Ex: 123456)"
                value={demoteId}
                onChange={(e) => setDemoteId(e.target.value)}
                className="flex-1 bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500/50 placeholder-gray-600"
                />
                <button 
                onClick={() => handleUpdateRole('demote')}
                disabled={loading || !demoteId}
                className="bg-red-900/10 hover:bg-red-900/20 border border-red-900/30 text-red-500 rounded-xl px-4 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <ArrowDownCircle size={24} />}
                </button>
            </div>

            {renderPreviewCard(demotePreview, loadingPreview === 'demote')}
          </div>
        </div>

        <button 
          onClick={() => setShowPromoterList(true)}
          className="w-full bg-transparent border border-yellow-500/30 hover:bg-yellow-500/5 text-yellow-500 font-bold text-sm py-4 rounded-2xl flex items-center justify-center gap-2 transition-all group mb-8"
        >
          <Users size={18} />
          LISTAR TODOS PROMOTORES
        </button>

      </div>
    </div>
  );
};
