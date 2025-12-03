
import React, { useState, useEffect } from 'react';
import { X, Copy, Users, Info, Loader2, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  profile: any;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose, currentUser, profile }) => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Logo URL (mesma usada no login)
  const logoUrl = "https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png";

  useEffect(() => {
    if (isOpen) {
      fetchReferralData();
    }
  }, [isOpen]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const { data: refData } = await supabase
        .from('referrals')
        .select(`
          status,
          created_at,
          profiles!referrals_referred_id_fkey (full_name, account_id)
        `)
        .eq('referrer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (refData) setReferrals(refData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const myCode = profile?.account_id || '...';
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(myCode);
    alert('Seu ID foi copiado!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-3xl border border-orange-900/30 shadow-[0_0_50px_rgba(234,88,12,0.1)] overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header Visual - GMD Theme */}
        <div className="relative bg-gradient-to-b from-[#161005] to-[#0a0a0a] p-6 pb-8 text-center shrink-0">
            <button onClick={onClose} className="absolute top-4 right-6 text-gray-500 hover:text-white"><X size={20} /></button>
            
            {/* Logo GMD */}
            <div className="w-20 h-20 rounded-full bg-black border border-yellow-500/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] overflow-hidden">
                <img src={logoUrl} alt="GMD Logo" className="w-full h-full object-contain" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">Indique e Ganhe</h2>
            <p className="text-gray-400 text-xs px-4">
                Receba <span className="text-orange-500 font-bold">R$ 10,00</span> a cada novo promotor.
            </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar -mt-4 bg-[#0a0a0a] rounded-t-3xl border-t border-gray-800">
            
            {/* Como Funciona */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-white mb-2">Como funciona?</p>
                        <ol className="text-xs text-gray-400 leading-relaxed space-y-2 list-decimal pl-3">
                            <li>Indique um amigo para ser Promotor.</li>
                            <li>Peça para ele informar <strong>SEU ID ({myCode})</strong> ao Administrador no momento da compra do plano.</li>
                            <li>Após o pagamento dele, você recebe <strong>R$ 10,00 via PIX</strong> do Administrador.</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Código de Convite */}
            <div className="mb-8 bg-[#161616] p-4 rounded-2xl border border-gray-800">
                <label className="text-xs text-gray-500 font-bold mb-3 block text-center uppercase tracking-widest">Seu ID para Indicação</label>
                
                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-3xl font-mono font-bold text-white tracking-widest">{myCode}</span>
                </div>
                
                <button 
                    onClick={handleCopyCode}
                    className="w-full bg-[#222] hover:bg-[#333] border border-gray-700 rounded-xl py-3 flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                    <Copy size={16} /> Copiar ID
                </button>
            </div>

            {/* Lista de Indicados */}
            <div>
                <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                    <Users size={16} className="text-orange-500" />
                    Indicações Confirmadas
                </h3>

                {loading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-orange-500" /></div>
                ) : referrals.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl bg-[#0f0f0f]">
                        <Megaphone size={24} className="text-gray-700 mx-auto mb-2" />
                        <p className="text-gray-500 text-xs">Nenhuma indicação confirmada.</p>
                        <p className="text-gray-700 text-[10px] mt-1">O pagamento aparece aqui após confirmação do Admin.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {referrals.map((ref, idx) => (
                            <div key={idx} className="bg-[#111] border border-gray-800 p-3 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-200">
                                        {ref.profiles?.full_name || 'Usuário'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-mono">
                                        #{ref.profiles?.account_id} • {new Date(ref.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-[10px] font-bold px-2 py-1 rounded border bg-orange-900/20 border-orange-900/50 text-orange-500">
                                    + R$ 10,00
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};
