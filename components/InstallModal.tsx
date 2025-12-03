
import React from 'react';
import { X, Share, PlusSquare, MoreVertical } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const logoUrl = "https://i.ibb.co/yFt5CZpK/AZq2-YHs-P-e-ER3okh-Kgbg-AZq2-YHsej-SMQe-If-Wn-CBQ.png";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content - Added max-h and overflow */}
      <div className="relative w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Close Button */}
        <div className="relative z-10 p-4 pb-0 flex justify-end">
            <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
            >
            <X size={24} />
            </button>
        </div>

        <div className="p-6 pt-0 overflow-y-auto">
          {/* Header with Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-full border border-yellow-500/30 flex items-center justify-center bg-black/40 shadow-[0_0_15px_rgba(234,179,8,0.1)] mb-4 shrink-0 overflow-hidden">
              <div className="absolute inset-0 rounded-full border border-yellow-500/10 pointer-events-none z-10"></div>
              <img 
                src={logoUrl} 
                alt="GMD App Icon" 
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 text-center">Instalar Aplicativo</h2>
            <p className="text-center text-gray-400 text-xs leading-relaxed px-2">
              Adicione o GMD à sua tela inicial para uma melhor experiência.
            </p>
          </div>

          {/* Instructions Container */}
          <div className="space-y-4">
            
            {/* iOS Section */}
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                No iPhone (iOS):
              </h3>
              <ol className="text-xs text-gray-400 space-y-3">
                <li className="flex gap-2">
                  <span className="text-gray-600">1.</span>
                  <div>
                    Toque no botão "Compartilhar" 
                    <span className="inline-flex mx-1 align-middle"><Share size={12} /></span> 
                    na barra inferior.
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-600">2.</span>
                  <div>
                    Role para baixo e toque em "Adicionar à Tela de Início" 
                    <span className="inline-flex mx-1 align-middle border border-gray-600 rounded-[2px]"><PlusSquare size={12} /></span>.
                  </div>
                </li>
              </ol>
            </div>

            {/* Android Section */}
            <div className="bg-[#111] border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                No Android (Chrome):
              </h3>
              <ol className="text-xs text-gray-400 space-y-3">
                <li className="flex gap-2">
                  <span className="text-gray-600">1.</span>
                  <div>
                    Toque nos três pontos no canto superior direito 
                    <span className="inline-flex mx-1 align-middle"><MoreVertical size={12} /></span>.
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-gray-600">2.</span>
                  <div>
                    Toque em "Instalar aplicativo" ou "Adicionar à tela inicial".
                  </div>
                </li>
              </ol>
            </div>

          </div>

          <button 
            onClick={onClose}
            className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition-all text-sm"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
