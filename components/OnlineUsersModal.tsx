
import React from 'react';
import { X, Users } from 'lucide-react';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  count: number;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({ isOpen, onClose, count }) => {
  if (!isOpen) return null;

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

        {/* Visual Card */}
        <div className="w-full bg-gradient-to-b from-[#0d1f12] to-[#0a0a0a] border border-green-900/30 rounded-2xl p-6 mb-6 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-green-500/20 transition-colors"></div>
            
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mx-auto mb-4 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <Users size={32} className="text-green-500" />
            </div>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Clientes Online</h3>
            <p className="text-green-500/70 text-[10px] mb-4">Ativos agora na plataforma</p>
            
            <div className="flex items-center justify-center">
               <span className="text-5xl font-mono font-bold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                 {count}
               </span>
            </div>
        </div>

        <button 
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-all text-sm"
        >
            Fechar
        </button>

      </div>
    </div>
  );
};
