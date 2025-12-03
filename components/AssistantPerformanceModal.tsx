import React, { useEffect, useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Clock, Loader2, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssistantPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssistantPerformanceModal: React.FC<AssistantPerformanceModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_assistant_analytics');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Erro analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-blue-900/30 shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col">
        
        <div className="p-6 pb-4 border-b border-gray-800 flex justify-between items-center bg-[#0f0f0f]">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Wallet size={18} className="text-blue-400" />
                    Minha Produção
                </h2>
                <p className="text-xs text-gray-500">Relatório Diário</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : stats ? (
                <div className="space-y-4">
                    
                    {/* Recargas */}
                    <div className="bg-[#0d1626] border border-blue-500/20 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-300 uppercase font-bold tracking-wider mb-1">Recargas Hoje</p>
                            <p className="text-3xl font-bold text-white">{stats.recharges_today}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
                            <ArrowDownLeft size={24} />
                        </div>
                    </div>

                    {/* Saques */}
                    <div className="bg-[#1a1111] border border-red-500/20 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-red-300 uppercase font-bold tracking-wider mb-1">Saques Hoje</p>
                            <p className="text-3xl font-bold text-white">{stats.withdrawals_today}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-400">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>

                    {/* Última Atividade */}
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-xl flex items-center gap-3">
                        <Clock size={18} className="text-gray-500" />
                        <div>
                            <p className="text-gray-300 text-sm font-bold">Última Movimentação</p>
                            <p className="text-xs text-gray-500">
                                {stats.last_activity 
                                    ? new Date(stats.last_activity).toLocaleTimeString() 
                                    : 'Nenhuma hoje'}
                            </p>
                        </div>
                    </div>

                </div>
            ) : (
                <p className="text-center text-gray-500">Sem dados.</p>
            )}
        </div>
      </div>
    </div>
  );
};