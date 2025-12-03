import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, AlertCircle, CheckCircle, Hash, User, Crown, Shield, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  currentUserId: string;
  onContactAdded: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUserRole,
  currentUserId,
  onContactAdded
}) => {
  const [accountIdInput, setAccountIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Estado para a pré-visualização do usuário encontrado
  const [previewUser, setPreviewUser] = useState<any>(null);
  const [searchingPreview, setSearchingPreview] = useState(false);

  // Reseta estados ao fechar ou abrir
  React.useEffect(() => {
    if (isOpen) {
      setAccountIdInput('');
      setError(null);
      setSuccess(false);
      setPreviewUser(null);
    }
  }, [isOpen]);

  // Efeito para buscar o usuário enquanto digita (Debounce)
  useEffect(() => {
    const cleanId = accountIdInput.replace(/[^a-zA-Z0-9]/g, '');

    // Limpa preview se o input for muito curto
    if (cleanId.length < 3) {
      setPreviewUser(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPreview(true);
      try {
        let foundUser = null;

        // Lógica de Fallback do Suporte (Mesma do submit)
        if (cleanId === '102030') {
           const { data: exactMatch } = await supabase
              .from('profiles')
              .select('id, full_name, role, account_id, avatar_url, email')
              .eq('account_id', cleanId)
              .maybeSingle();

           if (exactMatch) {
              foundUser = exactMatch;
           } else {
              // Fallback Admin
              const { data: adminUser } = await supabase
                 .from('profiles')
                 .select('id, full_name, role, account_id, avatar_url, email')
                 .eq('role', 'admin')
                 .limit(1)
                 .maybeSingle();
              foundUser = adminUser;
           }
        } else {
           // Busca normal
           const { data } = await supabase
             .from('profiles')
             .select('id, full_name, role, account_id, avatar_url, email')
             .eq('account_id', cleanId)
             .maybeSingle();
           foundUser = data;
        }

        setPreviewUser(foundUser);
      } catch (err) {
        console.error('Erro no preview:', err);
      } finally {
        setSearchingPreview(false);
      }
    }, 600); // Espera 600ms após parar de digitar

    return () => clearTimeout(timer);
  }, [accountIdInput]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Se já temos o preview, usamos ele para evitar nova busca
      let targetUser = previewUser;

      if (!targetUser) {
          // Se o usuário digitou e deu enter rápido demais antes do preview carregar
          const cleanId = accountIdInput.replace(/[^a-zA-Z0-9]/g, '');
          if (!cleanId) throw new Error('ID inválido.');
          
           if (cleanId === '102030') {
             const { data: admin } = await supabase.from('profiles').select('*').eq('role', 'admin').limit(1).maybeSingle();
             targetUser = admin;
           } else {
             const { data } = await supabase.from('profiles').select('*').eq('account_id', cleanId).maybeSingle();
             targetUser = data;
           }
      }

      if (!targetUser) {
        throw new Error('Usuário não encontrado com este ID.');
      }

      if (targetUser.id === currentUserId) {
        throw new Error('Você não pode adicionar a si mesmo.');
      }

      // 3. Validação de Regra de Negócio
      const isCommonUser = currentUserRole === 'user';
      const targetIsAuthority = ['admin', 'promoter', 'assistant'].includes(targetUser.role);

      if (isCommonUser && !targetIsAuthority) {
        throw new Error('Usuários comuns só podem adicionar Promotores ou Administradores.');
      }

      // 4. Adicionar aos contatos (USANDO RPC PARA ADICIONAR NOS DOIS LADOS)
      // Verifica se já existe a conexão (opcional, mas bom para UX)
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('contact_id', targetUser.id)
        .maybeSingle();

      if (existingContact) {
        throw new Error('Este usuário já está na sua lista de contatos.');
      }

      // Chama a função SQL criada para adicionar o contato bidirecionalmente
      const { error: rpcError } = await supabase.rpc('add_mutual_contact', {
        target_contact_id: targetUser.id
      });

      if (rpcError) throw rpcError;

      setSuccess(true);
      setTimeout(() => {
        onContactAdded();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Erro ao adicionar contato.';
      if (typeof err === 'string') errorMsg = err;
      else if (err?.message) errorMsg = err.message;
      else if (err?.error_description) errorMsg = err.error_description;
      else errorMsg = JSON.stringify(err);

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper para renderizar card do usuário encontrado
  const renderUserPreview = () => {
    if (searchingPreview) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={16} className="animate-spin text-gray-500" />
        </div>
      );
    }

    if (!previewUser && accountIdInput.length > 3) {
       return (
         <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2 text-red-400 text-xs">
           <AlertCircle size={14} />
           Usuário não encontrado.
         </div>
       );
    }

    if (previewUser) {
      const roleColors: any = {
        admin: 'text-orange-500',
        promoter: 'text-yellow-500',
        assistant: 'text-blue-400',
        user: 'text-gray-400'
      };
      
      const RoleIcon = {
        admin: Shield,
        promoter: Crown,
        assistant: Briefcase,
        user: User
      }[previewUser.role as string] || User;

      return (
        <div className="mt-4 bg-[#111] border border-gray-800 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
             {previewUser.avatar_url ? (
               <img src={previewUser.avatar_url} className="w-full h-full object-cover" />
             ) : (
               <span className="text-gray-500 font-bold">{previewUser.full_name?.charAt(0)}</span>
             )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-sm font-bold truncate">{previewUser.full_name}</p>
            <div className={`flex items-center gap-1 text-xs ${roleColors[previewUser.role] || 'text-gray-500'}`}>
              <RoleIcon size={12} />
              <span className="capitalize">{previewUser.role === 'user' ? 'Usuário Comum' : previewUser.role}</span>
            </div>
          </div>
          <div className="bg-[#1a1a1a] px-2 py-1 rounded text-[10px] text-gray-500 font-mono">
            #{previewUser.account_id}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xs bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8 flex flex-col items-center">
          
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-orange-900/30 flex items-center justify-center mb-4 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.15)]">
            <UserPlus size={20} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Adicionar Contato</h2>
          <p className="text-center text-gray-500 text-xs mb-6 px-2">
            Digite o ID do usuário {currentUserRole === 'user' ? '(Admin ou Promotor)' : ''} para adicionar.
          </p>

          {success ? (
            <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
              <CheckCircle size={40} className="text-green-500 mb-2" />
              <p className="text-green-500 font-bold">Contato Adicionado!</p>
            </div>
          ) : (
            <form onSubmit={handleAddContact} className="w-full">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-xs text-left">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <Hash size={18} />
                </div>
                <input
                  type="text" 
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  placeholder="ID da conta (ex: 12345)"
                  className="w-full bg-[#121212] border border-[#2a2a2a] text-gray-200 text-sm rounded-xl block pl-11 pr-4 py-3.5 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  autoFocus
                />
              </div>

              {/* Área de Preview */}
              <div className="mb-6 min-h-[20px]">
                {renderUserPreview()}
              </div>

              <Button type="submit" disabled={loading || (!!accountIdInput && !previewUser)}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};