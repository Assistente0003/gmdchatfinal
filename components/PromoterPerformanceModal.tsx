
import React, { useEffect, useState } from 'react';
import { X, TrendingUp, Users, MessageSquare, ThumbsUp, ThumbsDown, Clock, Loader2, Phone, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromoterPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBuyAssets?: () => void;
}

export const PromoterPerformanceModal: React.FC<PromoterPerformanceModalProps> = ({ isOpen, onClose, onOpenBuyAssets }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('get_promoter_analytics');
      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Analytics Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClient = (accountId: string) => {
    // Lógica para copiar ID ou redirecionar
    navigator.clipboard.writeText(accountId);
    alert(`ID ${accountId} copiado! Vá ao chat para iniciar a conversa.`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-500" />
                    Resultados
                </h2>
                <p className="text-xs text-gray-500">Painel do Promotor</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* BOTÃO COMPRAR ATIVOS (Inserido aqui conforme solicitado) */}
            {onOpenBuyAssets && (
                <button 
                    onClick={onOpenBuyAssets}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:brightness-110 text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20 transition-all active:scale-[0.98] border border-orange-500/20"
                >
                    <div className="bg-white/20 rounded-full p-1"><LinkIcon size={18} /></div>
                    COMPRAR ATIVOS
                </button>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500" /></div>
            ) : data ? (
                <>
                    {/* KPIs Principais */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#151515] p-4 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <MessageSquare size={16} />
                                <span className="text-xs font-bold uppercase">Atendimentos</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{data.messages_today} <span className="text-xs font-normal text-gray-500">hoje</span></p>
                        </div>
                        <div className="bg-[#151515] p-4 rounded-2xl border border-gray-800">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <ThumbsUp size={16} />
                                <span className="text-xs font-bold uppercase">Avaliações</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-green-500 font-bold text-xl">{data.positive_ratings}</span>
                                <span className="text-gray-600 text-sm">/</span>
                                <span className="text-red-500 font-bold text-lg">{data.negative_ratings}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Recuperação (Clientes Inativos) */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-orange-500" />
                            Recuperação de Clientes (+48h)
                        </h3>
                        <div className="bg-[#111] rounded-2xl border border-gray-800 overflow-hidden">
                            {data.inactive_clients && data.inactive_clients.length > 0 ? (
                                <div className="divide-y divide-gray-800">
                                    {data.inactive_clients.map((client: any, idx: number) => (
                                        <div key={idx} className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#222] overflow-hidden">
                                                    {client.avatar_url ? <img src={client.avatar_url} className="w-full h-full object-cover"/> : null}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-200">{client.full_name}</p>
                                                    <p className="text-[10px] text-gray-500">Inativo há 2 dias+</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleContactClient(client.account_id)}
                                                className="w-8 h-8 flex items-center justify-center bg-orange-900/20 text-orange-500 rounded-lg hover:bg-orange-900/40"
                                            >
                                                <Phone size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-xs text-gray-500">Nenhum cliente inativo encontrado.</div>
                            )}
                        </div>
                    </div>

                    {/* Top Clientes */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Users size={16} className="text-blue-400" />
                            Top Clientes (Mais Ativos)
                        </h3>
                        <div className="space-y-2">
                            {data.top_clients && data.top_clients.map((client: any, idx: number) => (
                                <div key={idx} className="bg-[#111] border border-gray-800 p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-600 font-mono text-xs">#{idx + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-200">{client.full_name}</span>
                                            <span className="text-[10px] text-gray-500">{client.msg_count} mensagens</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#222] px-2 py-1 rounded text-[10px] text-gray-400">
                                        #{client.account_id}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monitoramento de Equipe */}
                    {data.assistants_status && data.assistants_status.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <Users size={16} className="text-green-500" />
                                Monitoramento da Equipe
                            </h3>
                            <div className="grid gap-2">
                                {data.assistants_status.map((asst: any, idx: number) => {
                                    const lastSeen = new Date(asst.last_seen);
                                    const isOnline = (new Date().getTime() - lastSeen.getTime()) < 5 * 60 * 1000;
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-[#151515] p-3 rounded-xl border border-gray-800">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                                <span className="text-sm text-gray-200">{asst.full_name}</span>
                                            </div>
                                            <span className="text-[10px] text-gray-500">
                                                {isOnline ? 'Online agora' : `Visto às ${lastSeen.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center text-gray-500">Erro ao carregar dados.</div>
            )}
        </div>
      </div>
    </div>
  );
};
