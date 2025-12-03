import React, { useEffect, useState } from 'react';
import { X, Users, Shield, Briefcase, Database, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPerformanceModal: React.FC<AdminPerformanceModalProps> = ({ isOpen, onClose }) => {
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
      const { data, error } = await supabase.rpc('get_admin_analytics');
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

      <div className="relative w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-yellow-900/30 shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden flex flex-col">
        
        <div className="p-6 pb-4 border-b border-gray-800 flex justify-between items-center bg-[#0f0f0f]">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield size={18} className="text-yellow-500" />
                    Visão Geral
                </h2>
                <p className="text-xs text-gray-500">Dados do Sistema</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80dvh]">
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-yellow-500" /></div>
            ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                    {/* Card Total */}
                    <div className="col-span-2 bg-[#161205] border border-yellow-500/20 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-yellow-500/70 font-bold uppercase">Total de Contas</p>
                            <p className="text-3xl font-bold text-white">{stats.total_accounts}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
                            <Database size={24} className="text-yellow-500" />
                        </div>
                    </div>

                    {/* Usuários */}
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-2xl">
                        <Users size={20} className="text-gray-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.total_users}</p>
                        <p className="text-xs text-gray-500">Usuários Comuns</p>
                    </div>

                    {/* Promotores */}
                    <div className="bg-[#111] border border-gray-800 p-4 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10"><Shield size={40} /></div>
                        <Shield size={20} className="text-purple-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stats.total_promoters}</p>
                        <p className="text-xs text-gray-500">Promotores</p>
                    </div>

                    {/* Assistentes */}
                    <div className="col-span-2 bg-[#111] border border-gray-800 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Briefcase size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{stats.total_assistants}</p>
                            <p className="text-xs text-gray-500">Assistentes Ativos</p>
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