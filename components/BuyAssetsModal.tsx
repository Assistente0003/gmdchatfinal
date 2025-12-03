import React from 'react';
import { X, Coins, Copy } from 'lucide-react';

interface BuyAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyAssetsModal: React.FC<BuyAssetsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText('102030');
    // Feedback visual poderia ser adicionado aqui, mas o clique já é intuitivo
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xs bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center p-6 pt-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon Header */}
        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border border-orange-900/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,88,12,0.1)]">
            <Coins size={32} className="text-orange-500" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 text-center">Comprar Ativos</h2>
        <p className="text-center text-gray-500 text-xs mb-6 px-2 leading-relaxed">
          Recarregue para impulsionar seus resultados.
        </p>

        {/* Card do Pacote */}
        <div className="w-full bg-gradient-to-b from-[#161005] to-[#0a0a0a] border border-orange-500/30 rounded-2xl p-6 mb-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 blur-2xl rounded-full group-hover:bg-orange-500/20 transition-colors"></div>
            
            <h3 className="text-[10px] font-bold text-orange-500 tracking-widest uppercase mb-2">Pacote Promotor</h3>
            
            <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-4xl font-bold text-white">50</span>
                <span className="text-sm text-gray-400 font-medium pt-2">Ativos</span>
            </div>

            <div className="inline-block bg-orange-500 text-black font-bold text-sm px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                R$ 20,00
            </div>
        </div>

        {/* Footer Instructions */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4 w-full text-center">
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                Para comprar, entre em contato com o administrador via chat:
            </p>

            <button 
                onClick={handleCopyId}
                className="bg-black border border-gray-700 rounded-lg py-3 px-4 flex items-center justify-center gap-3 w-full mb-2 active:scale-95 transition-transform group"
            >
                <span className="text-orange-500 font-bold font-mono text-lg tracking-widest"># 102030</span>
            </button>
            
            <p className="text-[9px] text-gray-600">
                Copie o ID e chame no Chat.
            </p>
        </div>

      </div>
    </div>
  );
};