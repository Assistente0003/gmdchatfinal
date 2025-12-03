
import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, MessageCircle, Crown, Briefcase, Shield, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AddContactModal } from './AddContactModal';

interface ChatScreenProps {
  currentUserProfile: any;
  currentUserId: string;
  onSelectContact: (contact: any) => void;
  viewingAsPromoter: boolean;
  onToggleViewMode: (mode: boolean) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ 
  currentUserProfile, 
  currentUserId, 
  onSelectContact,
  viewingAsPromoter,
  onToggleViewMode
}) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  
  // Determina se o usuário pode alternar visões (Assistente)
  const isAssistant = currentUserProfile?.role === 'assistant';
  const parentId = currentUserProfile?.parent_id;

  useEffect(() => {
    fetchContacts();
  }, [viewingAsPromoter, currentUserId]); 

  const updateAppBadge = (totalUnread: number) => {
    if ('setAppBadge' in navigator) {
        if (totalUnread > 0) {
            navigator.setAppBadge(totalUnread).catch(e => console.error("Erro ao definir badge", e));
        } else {
            navigator.clearAppBadge().catch(e => console.error("Erro ao limpar badge", e));
        }
    }
  };

  const getLocalReadTime = (contactId: string) => {
      const key = `gmd_read_${contactId}`;
      const stored = sessionStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
  };

  const setLocalReadTime = (contactId: string) => {
      const key = `gmd_read_${contactId}`;
      sessionStorage.setItem(key, Date.now().toString());
  };

  const fetchContacts = async () => {
    // Não seta loading=true se já tiver contatos para evitar flash branco
    if (contacts.length === 0) setLoading(true);
    
    try {
      const targetUserId = (viewingAsPromoter && isAssistant && parentId) ? parentId : currentUserId;

      // 1. Buscar contatos na tabela de relacionamentos
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          profiles!contacts_contact_id_fkey (
            id, full_name, avatar_url, role, account_id, last_seen
          )
        `)
        .eq('user_id', targetUserId);

      if (error) throw error;

      let totalUnreadGlobal = 0;

      const formattedContacts = await Promise.all((contactsData || []).map(async (item: any) => {
        const contact = item.profiles;
        
        // Busca última mensagem para snippet e timestamp
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, read, type')
          .or(`and(sender_id.eq.${targetUserId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${targetUserId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Busca contagem "crua" do banco
        const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('sender_id', contact.id)
            .eq('receiver_id', targetUserId)
            .eq('read', false);
        
        let unread = count || 0;
        
        // --- LÓGICA DE CORREÇÃO ---
        // 1. Se a última mensagem fui EU (ou o Promotor que represento) que mandei, 
        // então é IMPOSSÍVEL ter mensagens não lidas relevantes para notificação visual imediata.
        if (lastMsg && lastMsg.sender_id === targetUserId) {
            unread = 0;
        } else {
            // 2. Se a última mensagem é do contato, verificamos o timestamp local
            const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
            const lastLocalRead = getLocalReadTime(contact.id);

            // Se a mensagem chegou antes do meu último clique, conta como 0
            if (lastMsgTime <= lastLocalRead) {
                unread = 0;
            }
        }
        
        totalUnreadGlobal += unread;

        return {
          ...contact,
          last_message: lastMsg?.content || '',
          last_message_time: lastMsg?.created_at || null,
          last_message_type: lastMsg?.type || 'text',
          last_message_sender: lastMsg?.sender_id,
          unread_count: unread
        };
      }));

      // Ordenar por mensagem mais recente
      const sorted = formattedContacts.sort((a: any, b: any) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        return timeB - timeA;
      });

      setContacts(sorted);
      updateAppBadge(totalUnreadGlobal);

    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- REALTIME UPDATES ---
  useEffect(() => {
    const targetUserId = (viewingAsPromoter && isAssistant && parentId) ? parentId : currentUserId;

    const channel = supabase.channel(`chat_list_updates:${currentUserId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload: any) => {
          const newMsg = payload.new;
          
          if (newMsg.sender_id === targetUserId || newMsg.receiver_id === targetUserId) {
             const otherId = newMsg.sender_id === targetUserId ? newMsg.receiver_id : newMsg.sender_id;
             
             setContacts(prev => {
                const exists = prev.find(c => c.id === otherId);
                let updatedContacts = [];
                
                if (exists) {
                    // Se EU enviei a mensagem, o unread count deve ser 0 (pois eu respondi)
                    let newUnreadCount = exists.unread_count;
                    if (newMsg.sender_id === targetUserId) {
                        newUnreadCount = 0;
                        // Atualiza timestamp local de leitura também para garantir
                        setLocalReadTime(otherId);
                    } else if (newMsg.receiver_id === targetUserId) {
                        // Se recebi a mensagem, incrementa
                        newUnreadCount = exists.unread_count + 1;
                    }

                    const updated = {
                        ...exists,
                        last_message: newMsg.content,
                        last_message_time: newMsg.created_at,
                        last_message_type: newMsg.type,
                        last_message_sender: newMsg.sender_id,
                        unread_count: newUnreadCount
                    };
                    const others = prev.filter(c => c.id !== otherId);
                    updatedContacts = [updated, ...others];
                } else {
                    // Contato novo ou não listado ainda -> Fetch completo para garantir dados
                    fetchContacts();
                    return prev;
                }

                const newTotal = updatedContacts.reduce((acc, c) => acc + c.unread_count, 0);
                updateAppBadge(newTotal);

                return updatedContacts;
             });
          }
        }
      )
      // Listener para UPDATE (quando a mensagem é marcada como lida)
      .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `read=eq.true` // Escuta apenas quando mensagens são marcadas como lidas
        },
        (payload) => {
            const updatedMsg = payload.new;
            // Se a mensagem lida era destinada a mim, atualizo meu contador
            if (updatedMsg.receiver_id === targetUserId) {
                setContacts(prev => {
                    const senderId = updatedMsg.sender_id;
                    // Força update local visualmente
                    return prev.map(c => 
                         c.id === senderId ? { ...c, unread_count: 0 } : c
                    );
                });
            }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, viewingAsPromoter, isAssistant, parentId]);


  const filteredContacts = contacts.filter(contact => 
    contact.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.account_id?.includes(searchQuery)
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={12} className="text-orange-500" />;
      case 'promoter': return <Crown size={12} className="text-yellow-500" />;
      case 'assistant': return <Briefcase size={12} className="text-blue-400" />;
      default: return null;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const handleContactClick = (contact: any) => {
    // 1. ATUALIZAÇÃO OTIMISTA IMEDIATA
    setContacts(prev => {
        const newContacts = prev.map(c => 
            c.id === contact.id ? { ...c, unread_count: 0 } : c
        );
        const newTotal = newContacts.reduce((acc, c) => acc + c.unread_count, 0);
        updateAppBadge(newTotal);
        return newContacts;
    });

    // 2. PERSISTÊNCIA LOCAL (A Mágica)
    // Salva que "li tudo deste contato até AGORA". 
    // Se o banco demorar ou falhar, o fetchContacts usará isso para mostrar 0.
    setLocalReadTime(contact.id);
    
    const targetUserId = (viewingAsPromoter && isAssistant && parentId) ? parentId : currentUserId;
    
    // 3. Atualiza DB (Background)
    supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', contact.id)
        .eq('receiver_id', targetUserId)
        .eq('read', false)
        .then(({ error }) => {
            if (error) console.error("Erro ao limpar mensagens:", error);
        });
    
    onSelectContact({
        ...contact,
        acting_sender_id: targetUserId
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <AddContactModal 
        isOpen={showAddContact} 
        onClose={() => setShowAddContact(false)}
        currentUserRole={currentUserProfile.role}
        currentUserId={currentUserId}
        onContactAdded={fetchContacts}
      />

      <div className="px-4 pt-2 pb-4 bg-[#050505] sticky top-0 z-10">
        
        {isAssistant && (
            <button 
                onClick={() => onToggleViewMode(!viewingAsPromoter)}
                className={`w-full mb-4 p-3 rounded-xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                    viewingAsPromoter 
                    ? 'bg-purple-900/10 border-purple-500/30 text-purple-400' 
                    : 'bg-[#111] border-gray-800 text-gray-400'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${viewingAsPromoter ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                        {viewingAsPromoter ? <Crown size={16} /> : <User size={16} />}
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">Modo de Visualização</p>
                        <p className="text-sm font-bold text-white">
                            {viewingAsPromoter ? 'Atuando como Promotor' : 'Minha Conta Pessoal'}
                        </p>
                    </div>
                </div>
                {viewingAsPromoter ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar conversa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] text-white pl-10 pr-4 py-3 rounded-xl border border-gray-800 focus:border-orange-500 focus:outline-none text-sm transition-all placeholder-gray-600"
            />
          </div>
          <button 
            onClick={() => setShowAddContact(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-orange-900/20 active:scale-95 border border-orange-500/20"
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-24">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-gray-500 text-xs animate-pulse">Sincronizando conversas...</p>
            </div>
        ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-4 border border-gray-800">
                    <MessageCircle size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Nenhuma conversa encontrada</p>
                <p className="text-gray-600 text-xs mt-1">Adicione um contato para começar</p>
            </div>
        ) : (
            <div className="space-y-1">
                {filteredContacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => handleContactClick(contact)}
                        className="w-full bg-transparent hover:bg-[#111] p-3 rounded-xl flex items-center gap-3 transition-colors border border-transparent hover:border-gray-800 group"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-gray-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-gray-600 transition-colors">
                                {contact.avatar_url ? (
                                    <img src={contact.avatar_url} alt={contact.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-500 font-bold text-lg">{contact.full_name?.charAt(0)}</span>
                                )}
                            </div>
                            {contact.role !== 'user' && (
                                <div className="absolute -bottom-1 -right-1 bg-[#0a0a0a] rounded-full p-0.5 border border-gray-800">
                                    <div className="w-4 h-4 rounded-full bg-[#111] flex items-center justify-center">
                                        {getRoleIcon(contact.role)}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className="text-white font-bold text-sm truncate pr-2 group-hover:text-orange-500 transition-colors">
                                    {contact.full_name}
                                </h3>
                                <span className={`text-[10px] font-medium ${contact.unread_count > 0 ? 'text-green-500' : 'text-gray-600'}`}>
                                    {formatTime(contact.last_message_time)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={`text-xs truncate max-w-[80%] h-4 ${contact.unread_count > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                                    {/* Adiciona prefixo 'Você:' se fui eu quem mandou */}
                                    {contact.last_message_sender === (isAssistant && viewingAsPromoter ? parentId : currentUserId) && 
                                        <span className="text-gray-600 mr-1">Você:</span>
                                    }
                                    {contact.last_message_type === 'image' ? '📷 Imagem' : 
                                     contact.last_message_type === 'audio' ? '🎤 Áudio' : 
                                     contact.last_message || 'Clique para iniciar a conversa'}
                                </p>
                                {contact.unread_count > 0 && (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-fade-in">
                                        <span className="text-black text-[10px] font-bold">{contact.unread_count}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
