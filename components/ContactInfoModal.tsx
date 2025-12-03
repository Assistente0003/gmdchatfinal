import React from 'react';
import { X, User, Shield, Crown, Briefcase, Hash } from 'lucide-react';

interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    name: string;
    avatarUrl?: string;
    accountId: string;
    role: string;
  };
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({ isOpen, onClose, contact }) => {
  if (!isOpen) return null;

  // Configuração visual dos cargos (Reutilizando padrão do ProfileScreen)
  const roleConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
    user: { 
      label: 'Usuário Comum', 
      color: 'text-gray-400', 
      bg: 'bg-gray-500/10',
      border: 'border-gray-600',
      icon: <User size={16} />
    },
    promoter: { 
      label: 'Promotor', 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500',
      icon: <Crown size={16} />
    },
    assistant: { 
      label: 'Assistente', 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500',
      icon: <Briefcase size={16} />
    },
    admin: { 
      label: 'Administrador', 
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500',
      icon: <Shield size={16} />
    }
  };

  const currentRole = roleConfig[contact.role] || roleConfig['user'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-xs bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col items-center p-6 pt-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Avatar Grande */}
        <div className="relative mb-4">
            <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${currentRole.bg.replace('/10', '')}`}></div>
            <div className={`relative w-24 h-24 rounded-full bg-[#121212] border-[2px] ${currentRole.border} overflow-hidden flex items-center justify-center shadow-lg`}>
            {contact.avatarUrl ? (
                <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-3xl font-bold text-gray-500">{contact.name.charAt(0).toUpperCase()}</span>
            )}
            </div>
        </div>

        {/* Nome */}
        <h2 className="text-xl font-bold text-white mb-1 text-center">{contact.name}</h2>
        
        {/* Cargo Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${currentRole.bg} ${currentRole.border} border-opacity-30 ${currentRole.color} text-xs font-bold uppercase tracking-wide mb-6`}>
            {currentRole.icon}
            {currentRole.label}
        </div>

        {/* ID Box */}
        <div className="w-full bg-[#121212] border border-[#1f1f1f] rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hash size={18} className="text-gray-500" />
            <span className="text-gray-300 text-sm font-medium">ID da Conta</span>
          </div>
          <span className="text-white font-bold font-mono tracking-wider text-lg">#{contact.accountId}</span>
        </div>

      </div>
    </div>
  );
};
