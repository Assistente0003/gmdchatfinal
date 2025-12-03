
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, UserPlus, Loader2, Briefcase, Crown, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromoterPanelProps {
  onBack: () => void;
  profile: any;
}

export const PromoterPanel: React.FC<PromoterPanelProps> = ({ onBack, profile }) => {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState<string | null>(null);
  
  const [assistantId, setAssistantId] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Normalização do Plano e Limites
  const rawPlan = profile?.plan_type || 'Básico';
  const planType = rawPlan.trim();
  const isPremium = planType.toLowerCase().includes('premium');
  const isComercial = planType.toLowerCase().includes('comercial');

  // Definição do Limite Visual
  let maxAssistants = 0;
  if (isPremium) {
    maxAssistants = 5;
  } else if (isComercial) {
    maxAssistants = 1;
  }
  
  // Respeita override do banco se existir
  if ((profile?.max_assistants || 0) > maxAssistants) {
      maxAssistants = profile.max_assistants;
  }

  const fetchAssistants = async () => {
    // Só mostra loading se a lista estiver vazia
    if (assistants.length === 0) setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_id', profile.id)
        .eq('role', 'assistant');

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Erro ao buscar assistentes:', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAssistants();
  }, [profile.id]);

  const handleAddAssistant = async () => {
    if (!assistantId) return;
    setLoadingAdd(true);
    setMessage(null);

    try {
      const cleanId = assistantId.replace(/[^0-9]/g, '');

      if (!cleanId) {
          throw new Error('ID inválido. Digite apenas números.');
      }

      if (assistants.length >= maxAssistants) {
         throw new Error(`Limite do plano atingido (${maxAssistants} assistentes).`);
      }

      // --- CHAMADA RPC SEGURA (SQL hire_assistant_v2) ---
      // Essa função no banco executa como Admin (Security Definer), ignorando RLS.
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('hire_assistant_v2', {
          target_account_id: cleanId
      });

      if (rpcError) {
          console.error("Erro RPC:", rpcError);
          // Fallback de erro genérico se a função não existir ou falhar drasticamente
          throw new Error("Erro de conexão com o servidor. Verifique se o SQL 'hire_assistant_v2' foi criado.");
      }

      // Verifica a resposta lógica do JSON retornado pelo SQL
      if (!rpcResponse.success) {
          throw new Error(rpcResponse.message || "Não foi possível realizar a contratação.");
      }

      // SUCESSO CONFIRMADO PELO BANCO
      setMessage({ type: 'success', text: rpcResponse.message });
      setAssistantId('');
      
      // Recarrega a lista oficial do banco para garantir sincronia
      await fetchAssistants();

    } catch (error: any) {
      console.error("Erro ao adicionar assistente:", error);
      let msg = 'Erro ao adicionar assistente.';

      if (typeof error === 'string') msg = error;
      else if (error?.message) msg = error.message;

      setMessage({ type: 'error', text: msg });
    } finally {
      setLoadingAdd(false);
    }
  };

  const executeRemoval = async (targetUuid: string, name: string) => {
    setLoadingRemove(targetUuid);
    setMessage(null);

    try {
        // Tenta usar RPC primeiro para limpeza completa
        // Se você não tiver essa função, use o update direto abaixo como fallback
        const { error: rpcError } = await supabase.rpc('promoter_remove_assistant', {
            target_id: targetUuid
        });

        if (rpcError) {
             // Fallback: Update manual
             const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'user', parent_id: null })
            .eq('id', targetUuid);

            if (updateError) throw updateError;
        }

        // Atualiza a lista removendo o item localmente para feedback instantâneo
        setAssistants(prev => prev.filter(a => a.id !== targetUuid));
        setMessage({ type: 'success', text: `${name} foi removido da equipe.` });
        
    } catch (error: any) {
        console.error(error);
        setMessage({ type: 'error', text: error.message || 'Erro ao remover assistente.' });
        fetchAssistants(); // Restaura em caso de erro
    } finally {
        setLoadingRemove(null);
    }
  };

  const handleRemoveAssistantFromList = async (targetId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name} da sua equipe?`)) {
        return;
    }
    await executeRemoval(targetId, name);
  };

  const currentCount = assistants.length;
  const isLimitReached = currentCount >= maxAssistants;

  return (
    <div className="fixed inset-0 z-[60] bg-[#050505] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 border-b border-[#1a1a1a] bg-[#050505] shrink-0">
        <button 
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Briefcase size={20} className="text-blue-400" />
          <h1 className="text-xl font-bold text-white">Minha Equipe</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar pb-safe-bottom">

        {/* Card do Plano */}
        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-gray-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-20">
              <Crown size={80} className="text-yellow-500" />
           </div>
           
           <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Seu Plano Atual</h3>
           <p className="text-2xl font-bold text-white mb-4">{planType}</p>
           
           <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-gray-700/50">
              <span className="text-sm text-gray-300">Vagas Preenchidas</span>
              <div className={`flex items-center gap-2 font-mono font-bold ${isLimitReached ? 'text-red-500' : 'text-green-500'}`}>
                 <span className="text-xl">{currentCount}</span>
                 <span className="text-gray-600 text-sm">/</span>
                 <span className="text-sm text-gray-500">{maxAssistants}</span>
              </div>
           </div>

           {maxAssistants === 0 && (
             <div className="mt-4 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-900/10 p-2 rounded-lg border border-yellow-900/20">
                <AlertTriangle size={14} />
                <span>O Plano Básico não permite assistentes.</span>
             </div>
           )}
        </div>

        {/* Mensagens de Feedback */}
        {message && (
            <div className={`mb-6 text-xs p-4 rounded-xl border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-400' : 'bg-red-900/20 border-red-900/50 text-red-400'}`}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {message.text}
            </div>
        )}

        {/* Formulário de Adição */}
        {maxAssistants > 0 && (
            <div className="mb-8">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <UserPlus size={16} className="text-blue-400" />
                    Contratar Novo Assistente
                </h3>
                
                <div className="flex gap-2">
                    <input 
                        type="tel"
                        pattern="[0-9]*" 
                        placeholder="ID do Usuário (Ex: 123456)"
                        value={assistantId}
                        onChange={(e) => setAssistantId(e.target.value)}
                        className="flex-1 bg-[#161616] border border-[#2a2a2a] text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 placeholder-gray-600"
                    />
                    <button 
                        onClick={handleAddAssistant}
                        disabled={loadingAdd || isLimitReached || !assistantId}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 flex items-center justify-center transition-colors shadow-lg shadow-blue-900/20"
                    >
                        {loadingAdd ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    </button>
                </div>
                {isLimitReached && (
                    <p className="text-red-500 text-[10px] mt-2 text-right">
                        Você atingiu o limite de assistentes do plano {planType}.
                    </p>
                )}
            </div>
        )}

        {/* Lista de Assistentes */}
        <div className="mb-8">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center justify-between">
                Seus Assistentes
                {loadingList && <Loader2 size={12} className="animate-spin" />}
            </h3>
            
            {assistants.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-800 rounded-2xl">
                    <Users size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum assistente contratado.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assistants.map((assistant) => (
                        <div key={assistant.id} className="bg-[#111] border border-gray-800 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                             <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-gray-700 overflow-hidden">
                                {assistant.avatar_url ? (
                                    <img src={assistant.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <Briefcase size={16} className="text-blue-400" />
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold truncate">{assistant.full_name}</p>
                                <p className="text-gray-500 text-xs font-mono">#{assistant.account_id}</p>
                             </div>
                             
                             <button 
                                onClick={() => handleRemoveAssistantFromList(assistant.id, assistant.full_name)}
                                disabled={loadingRemove === assistant.id}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                                title="Remover Assistente"
                             >
                                {loadingRemove === assistant.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                             </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
