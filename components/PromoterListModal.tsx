import React, { useEffect, useState } from 'react';
import { X, Users, Search, Crown, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromoterListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoterListModal: React.FC<PromoterListModalProps> = ({ isOpen, onClose }) => {
  const [promoters, setPromoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPromoters();

      // --- REALTIME LISTENER ---
      const channel = supabase
        .channel('public:profiles_list_promoters')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', 
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            console.log('Mudança detectada nos perfis, atualizando lista...', payload);
            fetchPromoters();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const fetchPromoters = async () => {
    // Só mostra spinner se não tiver dados
    if (promoters.length === 0) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'promoter')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setPromoters(data || []);
    } catch (error) {
      console.error('Erro ao buscar promotores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80dvh]">
        {/* Header */}
        <div className="relative z-10 p-5 flex items-center justify-between border-b border-gray-800/50">
            <div className="flex items-center gap-2">
                <Users size={18} className="text-yellow-500" />
                <h2 className="text-white font-bold text-lg">Lista de Promotores</h2>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={fetchPromoters}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Atualizar lista"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={onClose}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto min-h-[200px] bg-[#0f0f0f]">
          {loading && promoters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
               <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-gray-500 text-xs">Carregando lista...</span>
            </div>
          ) : promoters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
               <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3">
                  <Crown size={24} className="text-gray-600" />
               </div>
               <span className="text-gray-500 font-medium text-sm">Nenhum promotor encontrado.</span>
               <p className="text-gray-700 text-xs mt-1">Promova usuários no painel anterior.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {promoters.map((promoter) => (
                <div key={promoter.id} className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-yellow-500/30 flex items-center justify-center text-yellow-500 overflow-hidden">
                      {promoter.avatar_url ? (
                        <img src={promoter.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <Crown size={16} />
                      )}
                    </div>
                    {/* Status Dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate group-hover:text-yellow-500 transition-colors">
                      {promoter.full_name || 'Sem nome'}
                    </p>
                    <p className="text-gray-500 text-xs truncate font-mono tracking-tight opacity-70">
                      {promoter.email}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-[#1a1a1a] px-2 py-1 rounded text-[10px] text-gray-400 font-mono border border-gray-800">
                      #{promoter.account_id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-3 bg-[#0a0a0a] border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-600">Total: {promoters.length} promotores ativos</p>
        </div>
      </div>
    </div>
  );
};