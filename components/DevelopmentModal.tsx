
import React from 'react';
import { X, Hammer, Construction } from 'lucide-react';

interface DevelopmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export const DevelopmentModal: React.FC<DevelopmentModalProps> = ({ isOpen, onClose, featureName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
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
        <div className="w-20 h-20 rounded-full bg-[#111] border border-orange-500/20 flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-orange-500/5 blur-xl"></div>
            <Construction size={32} className="text-orange-500 relative z-10" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2 text-center">Em Desenvolvimento</h2>
        
        <div className="bg-[#111] border border-gray-800 rounded-xl p-4 w-full text-center mb-6">
            <p className="text-gray-400 text-xs mb-1">A funcionalidade</p>
            <p className="text-orange-500 font-bold text-lg mb-2">"{featureName}"</p>
            <p className="text-gray-500 text-xs leading-relaxed">
                Estará disponível em breve! Estamos trabalhando para trazer a melhor experiência para você.
            </p>
        </div>

        <button 
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-all text-sm"
        >
            Entendi
        </button>

      </div>
    </div>
  );
};
