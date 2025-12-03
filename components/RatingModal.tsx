
import React, { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, Loader2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterId: string;
  promoterName: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, promoterId, promoterName }) => {
  const [loading, setLoading] = useState(false);
  const [canVote, setCanVote] = useState(true);
  const [isAllowedUser, setIsAllowedUser] = useState(true); // Nova verificação de cargo
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [success, setSuccess] = useState<'positive' | 'negative' | null>(null);

  useEffect(() => {
    if (isOpen && promoterId) {
      checkEligibility();
    }
  }, [isOpen, promoterId]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Verificar CARGO (apenas 'user' pode avaliar)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.role !== 'user') {
        setIsAllowedUser(false);
        setLoading(false);
        return;
      }
      setIsAllowedUser(true);

      // 2. Verifica a última avaliação (limite 24h)
      const { data, error } = await supabase
        .from('ratings')
        .select('created_at')
        .eq('rater_id', user.id)
        .eq('rated_id', promoterId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const lastVoteDate = new Date(data.created_at);
        const now = new Date();
        const diffMs = now.getTime() - lastVoteDate.getTime();
        const hours24 = 24 * 60 * 60 * 1000;

        if (diffMs < hours24) {
          setCanVote(false);
          const remainingMs = hours24 - diffMs;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setCanVote(true);
        }
      } else {
        setCanVote(true);
      }
    } catch (error) {
      console.error('Erro ao verificar elegibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 1 | -1) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('ratings').insert({
        rater_id: user.id,
        rated_id: promoterId,
        vote: voteType
      });

      if (error) throw error;

      setSuccess(voteType === 1 ? 'positive' : 'negative');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);

    } catch (error) {
      console.error('Erro ao votar:', error);
      alert('Erro ao registrar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={20} />
        </button>

        <h2 className="text-center text-white font-bold text-lg mb-1">Avaliar Promotor</h2>
        <p className="text-center text-gray-500 text-xs mb-6">Como está sendo sua experiência com <span className="text-orange-500">{promoterName}</span>?</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        ) : success ? (
          <div className="flex flex-col items-center py-6 text-green-500 animate-fade-in">
            <CheckCircle size={48} className="mb-3" />
            <p className="font-bold">Avaliação registrada!</p>
          </div>
        ) : !isAllowedUser ? (
            <div className="bg-[#1a1111] border border-red-900/30 rounded-xl p-4 text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
                <p className="text-red-400 text-sm font-bold">Ação Bloqueada</p>
                <p className="text-gray-500 text-xs mt-1">Apenas usuários comuns podem avaliar promotores.</p>
            </div>
        ) : !canVote ? (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-4 text-center">
            <Clock size={32} className="text-yellow-600 mx-auto mb-2" />
            <p className="text-gray-300 text-sm font-medium mb-1">Limite Diário Atingido</p>
            <p className="text-gray-500 text-xs">
              Você poderá avaliar este promotor novamente em:
            </p>
            <p className="text-white font-mono text-lg font-bold mt-2">{timeRemaining}</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => handleVote(1)}
              className="flex-1 bg-[#111] border border-green-900/30 hover:bg-green-900/20 hover:border-green-500/50 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ThumbsUp size={24} className="text-green-500" />
              </div>
              <span className="text-green-500 font-bold text-sm">Positiva</span>
            </button>

            <button 
              onClick={() => handleVote(-1)}
              className="flex-1 bg-[#111] border border-red-900/30 hover:bg-red-900/20 hover:border-red-500/50 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ThumbsDown size={24} className="text-red-500" />
              </div>
              <span className="text-red-500 font-bold text-sm">Negativa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
