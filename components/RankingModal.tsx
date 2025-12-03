
import React, { useEffect, useState } from 'react';
import { X, Trophy, Medal, Crown, Gift, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchRanking();
    }
  }, [isOpen]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_ranking')
        .select('*')
        .order('score', { ascending: false })
        .limit(20); // Buscamos mais para mostrar o pódio + lista

      if (error) throw error;
      setRanking(data || []);
    } catch (error) {
      console.error('Erro ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrizeText = (index: number) => {
    switch (index) {
        case 0: return 'Renovação + 70 ativos';
        case 1: return '50% OFF Renovação';
        case 2: return '10% OFF Renovação';
        default: return null;
    }
  };

  // Separa o Top 3 do resto
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  // Helper para renderizar card do pódio
  const renderPodiumItem = (item: any, position: number) => {
    if (!item) return <div className="w-1/3"></div>; // Placeholder vazio para layout não quebrar

    let styles = {
        wrapper: '',
        avatarBorder: '',
        medalColor: '',
        glow: '',
        height: '',
        badge: ''
    };

    if (position === 0) { // 1st Place
        styles = {
            wrapper: 'order-2 -mt-8 scale-110 z-10', // Centro, mais alto, maior
            avatarBorder: 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]',
            medalColor: 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]',
            glow: 'bg-yellow-500/10 border-yellow-500/30',
            height: 'h-40',
            badge: 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black'
        };
    } else if (position === 1) { // 2nd Place
        styles = {
            wrapper: 'order-1', // Esquerda
            avatarBorder: 'border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.3)]',
            medalColor: 'text-gray-300',
            glow: 'bg-gray-500/10 border-gray-500/30',
            height: 'h-32',
            badge: 'bg-gray-600 text-white'
        };
    } else { // 3rd Place
        styles = {
            wrapper: 'order-3', // Direita
            avatarBorder: 'border-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.3)]',
            medalColor: 'text-amber-700',
            glow: 'bg-amber-900/10 border-amber-900/30',
            height: 'h-28',
            badge: 'bg-amber-800 text-white'
        };
    }

    const prize = getPrizeText(position);

    return (
        <div className={`flex flex-col items-center w-1/3 relative ${styles.wrapper} transition-all`}>
            {/* Crown for #1 */}
            {position === 0 && (
                <Crown size={32} className="text-yellow-400 mb-1 fill-yellow-400/20" />
            )}

            {/* Avatar */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1a1a1a] border-2 ${styles.avatarBorder} overflow-hidden mb-2`}>
                 {item.avatar_url ? (
                    <img src={item.avatar_url} className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#222]">
                        <Crown size={24} className="text-gray-600" />
                    </div>
                 )}
            </div>

            {/* Name & Score Box */}
            <div className={`w-full flex flex-col items-center justify-center p-2 rounded-xl border backdrop-blur-sm ${styles.glow} ${styles.height}`}>
                <p className="text-white font-bold text-xs sm:text-sm truncate w-full text-center px-1 mb-1">
                    {item.full_name?.split(' ')[0]}
                </p>
                <div className="flex items-center gap-1 mb-2">
                    <Medal size={16} className={styles.medalColor} fill="currentColor" />
                    <span className="text-white font-mono font-bold text-sm">{item.score || 0}</span>
                </div>
                
                {prize && (
                    <div className={`text-[8px] font-bold px-2 py-1 rounded-full flex flex-col items-center text-center leading-tight shadow-sm w-full ${styles.badge}`}>
                        <span>{prize.split('+')[0]}</span>
                        {prize.includes('+') && <span>+{prize.split('+')[1]}</span>}
                    </div>
                )}
            </div>
            
            {/* Position Number Base */}
            <div className={`absolute -bottom-3 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md border border-gray-800 z-20 ${position === 0 ? 'bg-yellow-500 text-black' : position === 1 ? 'bg-gray-300 text-black' : 'bg-amber-700 text-white'}`}>
                {position + 1}
            </div>
        </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#050505] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header */}
        <div className="relative z-10 p-6 pb-4 border-b border-gray-800 bg-[#0a0a0a] shrink-0">
            <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                    <Trophy size={24} className="text-yellow-500" />
                    <h2 className="text-xl font-bold text-white">Ranking Semanal</h2>
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">Top Promotores</p>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar p-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
                <span className="text-gray-500 text-xs">Carregando pódio...</span>
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">Nenhum dado disponível.</div>
          ) : (
            <>
                {/* --- PÓDIO (TOP 3) --- */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-6 px-2">
                    {/* 2nd Place (Left) */}
                    {ranking.length > 1 ? renderPodiumItem(ranking[1], 1) : <div className="w-1/3"></div>}
                    
                    {/* 1st Place (Center) */}
                    {ranking.length > 0 ? renderPodiumItem(ranking[0], 0) : <div className="w-1/3"></div>}
                    
                    {/* 3rd Place (Right) */}
                    {ranking.length > 2 ? renderPodiumItem(ranking[2], 2) : <div className="w-1/3"></div>}
                </div>

                {/* --- LISTA (4º em diante) --- */}
                {rest.length > 0 && (
                    <div className="space-y-2 pb-4">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 pl-2 border-l-2 border-orange-500 ml-1">
                            Outros Colocados
                        </h3>
                        {rest.map((item, index) => {
                            const position = index + 4;
                            return (
                                <div key={item.id} className="flex items-center gap-3 bg-[#111] border border-gray-800 p-3 rounded-xl shadow-sm hover:bg-[#161616] transition-colors">
                                    {/* Position */}
                                    <div className="w-8 flex justify-center">
                                        <span className="text-gray-500 font-mono font-bold text-sm">#{position}</span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                                        {item.avatar_url ? (
                                            <img src={item.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-500 text-xs font-bold">{item.full_name?.charAt(0)}</span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-200 font-bold text-sm truncate">{item.full_name}</p>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right bg-[#0a0a0a] px-2 py-1 rounded-lg border border-gray-800">
                                        <span className="text-orange-500 font-mono font-bold text-sm">{item.score}</span>
                                        <span className="text-[10px] text-gray-600 ml-1">pts</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
