
import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Megaphone } from 'lucide-react';

interface NotificationToastProps {
  data: {
    senderName: string;
    avatarUrl?: string;
    content: string;
    senderId: string;
  } | null;
  onClose: () => void;
  onClick: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ data, onClose, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeData, setActiveData] = useState(data);

  // Efeito para gerenciar a entrada (Show)
  useEffect(() => {
    if (data) {
      setActiveData(data);
      // Pequeno delay para garantir que o navegador renderize antes de animar
      setTimeout(() => setIsVisible(true), 10);

      // Timer para fechar sozinho após 4.5 segundos
      const timer = setTimeout(() => {
        handleClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleClose = () => {
    setIsVisible(false);
    // Espera a animação de saída terminar (500ms) antes de limpar os dados
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!activeData) return null;

  const isNews = activeData.senderId === 'news';

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none pt-4 px-4">
      <div 
        onClick={() => {
            onClick();
            handleClose();
        }}
        className={`
          pointer-events-auto cursor-pointer
          relative w-full max-w-[360px]
          bg-[#1a1a1a]/95 backdrop-blur-md
          border border-gray-700/50
          shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          rounded-2xl p-3
          flex items-center gap-3
          transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-24 opacity-0 scale-95'}
        `}
      >
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border ${isNews ? 'border-orange-500/50 bg-orange-900/20' : 'border-gray-600 bg-[#252525]'}`}>
            {isNews ? (
                <Megaphone size={20} className="text-orange-500" />
            ) : activeData.avatarUrl ? (
              <img 
                src={activeData.avatarUrl} 
                alt={activeData.senderName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-gray-400 font-bold text-lg">
                {activeData.senderName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Ícone do App Pequeno (Badge) */}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border border-gray-800">
             {isNews ? <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div> : <MessageCircle size={10} className="text-green-500 fill-current" />}
          </div>
        </div>

        {/* Text Section */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className={`text-sm font-bold truncate ${isNews ? 'text-orange-400' : 'text-white'}`}>
              {activeData.senderName}
            </h4>
            <span className="text-[10px] text-gray-500 font-medium">Agora</span>
          </div>
          
          <p className="text-xs text-gray-300 truncate leading-relaxed">
             {activeData.content.includes('chat-media') 
                ? <span className="flex items-center gap-1 italic opacity-80">📷 Mídia recebida</span> 
                : activeData.content}
          </p>
        </div>

        {/* Close Button (Area de toque maior) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
