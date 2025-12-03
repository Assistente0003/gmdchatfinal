
import React, { useState, useEffect, useRef, memo, useCallback, useLayoutEffect } from 'react';
import { ArrowLeft, Send, Loader2, Paperclip, Image as ImageIcon, Eye, Star, CheckCheck, Mic, Trash2, DollarSign, TrendingUp, TrendingDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ContactInfoModal } from './ContactInfoModal';
import { RatingModal } from './RatingModal';
import { playNotificationSound } from '../lib/sounds';

interface ChatWindowProps {
  currentUser: any;
  currentUserProfile: any; 
  contact: any;
  onBack: () => void;
  actingSenderId?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  created_at: string;
  type?: 'text' | 'image' | 'audio';
  file_url?: string;
  read?: boolean;
}

const SmartTextRenderer: React.FC<{ text: string }> = memo(({ text }) => {
    const parts = text.split(/(\s+)/);
    // Regex simples para detectar URLs/Emails (básico para performance)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    const numberRegex = /(\b\d{4,}\b)/;

    const copyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <p className="break-words break-all whitespace-pre-wrap text-[14px] leading-relaxed min-w-0 font-normal">
            {parts.map((part, i) => {
                if (emailRegex.test(part)) {
                    return (
                        <span 
                            key={i}
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(part); }}
                            className="text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline"
                        >
                            {part}
                        </span>
                    );
                } else if (numberRegex.test(part)) {
                    return (
                        <span 
                            key={i}
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(part); }}
                            className="text-green-700 dark:text-green-400 font-bold cursor-pointer hover:underline"
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </p>
    );
});

const MessageBubble = memo(({ msg, isMe }: { msg: Message, isMe: boolean }) => {
    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1.5 w-full animate-fade-in`}>
            <div 
                className={`max-w-[85%] sm:max-w-[75%] rounded-[18px] px-3.5 py-2.5 text-sm relative shadow-sm border transition-all overflow-hidden ${
                    isMe 
                    ? 'bg-gradient-to-br from-orange-100 to-orange-50 dark:from-[#2a1a0a] dark:to-[#1a0f05] border-orange-200/50 dark:border-orange-900/30 text-gray-900 dark:text-white rounded-br-[4px]' 
                    : 'bg-white dark:bg-[#111] border-gray-100 dark:border-[#222] text-gray-800 dark:text-gray-200 rounded-bl-[4px]'
                }`}
            >
                {msg.type === 'image' && msg.file_url ? (
                    <div className="flex flex-col gap-1 min-w-[140px]">
                        <a 
                            href={msg.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[10px] font-bold transition-all active:scale-95 border ${
                                isMe ? 'bg-orange-600 text-white border-orange-700' : 'bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <Eye size={14} />
                            VER IMAGEM
                        </a>
                    </div>
                ) : msg.type === 'audio' && msg.file_url ? (
                    <div className="flex items-center gap-3 min-w-[160px] py-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isMe ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-[#252525] text-gray-500'}`}>
                            <Mic size={14} />
                        </div>
                        <audio 
                            controls 
                            src={msg.file_url} 
                            className="h-8 w-[140px]" 
                            style={{ filter: isMe ? 'sepia(1) hue-rotate(-50deg) saturate(3)' : 'invert(0.9)' }}
                            onPlay={(e) => {
                                // Pausa outros audios
                                const audios = document.getElementsByTagName('audio');
                                for(let i = 0; i < audios.length; i++){
                                    if(audios[i] !== e.target) audios[i].pause();
                                }
                            }}
                        />
                    </div>
                ) : (
                    <SmartTextRenderer text={msg.content || ''} />
                )}
                
                <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-orange-900/40 dark:text-orange-200/30' : 'text-gray-400'}`}>
                    <span className="text-[9px] font-medium opacity-80">{formatTime(msg.created_at)}</span>
                    {isMe && (
                        <CheckCheck 
                            size={12} 
                            className={msg.read ? 'text-blue-500' : 'text-current'} 
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, currentUserProfile, contact, onBack, actingSenderId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProdMenu, setShowProdMenu] = useState(false);
  const [prodValue, setProdValue] = useState('');
  const [prodType, setProdType] = useState<'recarga' | 'saque' | null>(null);
  
  const [isTyping, setIsTyping] = useState(false);
  const [contactStatus, setContactStatus] = useState<'online' | 'offline'>('offline');
  const [lastSeenText, setLastSeenText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const processedReadIds = useRef<Set<string>>(new Set());

  const contactName = contact?.full_name || contact?.contact?.full_name || 'Usuário';
  const contactAvatar = contact?.avatar_url || contact?.contact?.avatar_url;
  const contactId = contact?.id || contact?.contact?.id;
  const contactRole = contact?.role || contact?.contact?.role || 'user';
  const contactAccountId = contact?.account_id || contact?.contact?.account_id || '---';

  const senderId = actingSenderId || currentUser.id;
  const roomId = [senderId, contactId].sort().join('_');
  const isChattingWithPromoter = contactRole === 'promoter';
  const isAssistant = currentUserProfile?.role === 'assistant'; 

  // Função de Scroll otimizada para evitar repaints
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current) {
        requestAnimationFrame(() => {
            if(messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
            }
        });
    }
  }, []);

  useLayoutEffect(() => {
    // Scroll inicial e quando carrega mensagens
    if (!loading) {
        scrollToBottom(true); // Força scroll instantâneo no carregamento
    }
  }, [messages.length, loading, isTyping, isRecording]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
        textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [newMessage]);

  const markMessagesAsRead = useCallback(async (msgs: Message[]) => {
    const unreadIds = msgs
        .filter(m => m.receiver_id === senderId && !m.read && !processedReadIds.current.has(m.id))
        .map(m => m.id);

    if (unreadIds.length > 0) {
        unreadIds.forEach(id => processedReadIds.current.add(id));
        supabase.from('messages').update({ read: true }).in('id', unreadIds).then(({ error }) => {
            if(error) unreadIds.forEach(id => processedReadIds.current.delete(id));
        });
    }
  }, [senderId]);

  // Status de Online/Offline
  useEffect(() => {
    const rawLastSeen = contact?.last_seen || contact?.contact?.last_seen;
    const updateStatus = () => {
      if (!rawLastSeen) {
        setLastSeenText('');
        setContactStatus('offline');
        return;
      }
      const lastSeenDate = new Date(rawLastSeen);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 60000;

      if (diffMinutes < 5) {
        setContactStatus('online');
        setLastSeenText('Online');
      } else {
        setContactStatus('offline');
        const isToday = lastSeenDate.getDate() === now.getDate();
        const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSeenText(isToday ? timeStr : lastSeenDate.toLocaleDateString());
      }
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000); 
    return () => clearInterval(interval);
  }, [contact]);

  // Fetch e Realtime
  useEffect(() => {
    let isMounted = true;
    
    const fetchMessages = async () => {
        if (!senderId || !contactId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${senderId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${senderId})`)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            if (isMounted) {
                const msgs = data || [];
                setMessages(msgs);
                markMessagesAsRead(msgs); 
            }
        } catch (error) {
            console.error('Erro mensagens:', error);
        } finally {
            if (isMounted) setLoading(false);
        }
    };
    fetchMessages();

    // Configuração do Canal
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          if (!isMounted) return;
          const newMsg = payload.new;
          const isRelevant = (newMsg.sender_id === senderId && newMsg.receiver_id === contactId) ||
                             (newMsg.sender_id === contactId && newMsg.receiver_id === senderId);

          if (isRelevant) {
              setMessages((prev) => {
                  if (prev.some(m => m.id === newMsg.id)) return prev;
                  // Remove mensagens otimistas temporárias
                  const filtered = prev.filter(m => !m.id.startsWith('temp-'));
                  return [...filtered, newMsg];
              });
              
              if (newMsg.receiver_id === senderId) {
                  setIsTyping(false);
                  markMessagesAsRead([newMsg]);
                  playNotificationSound();
              }
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
         if (!isMounted) return;
         const updatedMsg = payload.new;
         setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
         if (!isMounted) return;
         if (payload.user_id !== senderId) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => { 
                if (isMounted) setIsTyping(false); 
            }, 3000);
         }
      })
      .subscribe();

    return () => { 
        isMounted = false;
        supabase.removeChannel(channel); 
    };
  }, [contactId, senderId, roomId, markMessagesAsRead]); // Dependências estáveis

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => { setRecordingDuration(prev => prev + 1); }, 1000);
    } catch (err) {
      alert('Permita o acesso ao microfone.');
    }
  };

  const handleStopRecording = async (shouldSend: boolean) => {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const stream = mediaRecorderRef.current?.stream;
      stream?.getTracks().forEach(track => track.stop()); 

      if (shouldSend) await sendAudioMessage(audioBlob);
      
      setIsRecording(false);
      setRecordingDuration(0);
      mediaRecorderRef.current = null;
    };
    mediaRecorderRef.current.stop();
  };

  const sendAudioMessage = async (blob: Blob) => {
    setUploading(true);
    try {
        const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(fileName, blob, { contentType: 'audio/webm' });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
        
        const { error: dbError } = await supabase.from('messages').insert({
            sender_id: senderId, receiver_id: contactId, content: 'Áudio', type: 'audio', file_url: urlData.publicUrl, read: false
        });
        if (dbError) throw dbError;
        
        // Atualiza timestamp local de leitura ao enviar, para não contar como não lido
        sessionStorage.setItem(`gmd_read_${contactId}`, Date.now().toString());

    } catch (err) {
        alert('Falha ao enviar áudio.');
    } finally {
        setUploading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent, customContent?: string) => {
    if (e) e.preventDefault();
    const msgContent = customContent || newMessage.trim();
    if (!msgContent) return;

    setNewMessage(''); 
    setSending(true);
    
    // Atualiza timestamp local de leitura ao enviar, para não contar como não lido se voltar pra lista
    sessionStorage.setItem(`gmd_read_${contactId}`, Date.now().toString());
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
        id: tempId, sender_id: senderId, receiver_id: contactId, content: msgContent, created_at: new Date().toISOString(), type: 'text', read: false
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const { error } = await supabase.from('messages').insert({
          sender_id: senderId, receiver_id: contactId, content: msgContent, type: 'text', read: false
      });
      if (error) throw error;
    } catch (error) {
      console.error("Erro envio:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) { alert("Limite de 10MB."); return; }
    
    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(safeName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error();
        const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(safeName);
        await supabase.from('messages').insert({
          sender_id: senderId, receiver_id: contactId, content: 'Imagem', type: 'image', file_url: urlData.publicUrl, read: false
        });
        
        // Atualiza timestamp local de leitura ao enviar
        sessionStorage.setItem(`gmd_read_${contactId}`, Date.now().toString());

    } catch (error: any) {
        alert("Erro ao enviar imagem.");
    } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProductionSubmit = () => {
      if (!prodType || !prodValue) return;
      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(prodValue) || 0);
      const text = prodType === 'recarga' ? `✅ RECARGA REALIZADA\nValor: ${formattedValue}` : `💸 SAQUE REALIZADO\nValor: ${formattedValue}`;
      handleSendMessage(undefined, text);
      setShowProdMenu(false);
      setProdType(null);
      setProdValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (window.innerWidth >= 768) {
             e.preventDefault();
             handleSendMessage(e);
        }
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f9fafb] dark:bg-[#050505] animate-fade-in fixed inset-0 z-50 transition-colors duration-300">
      
      <ContactInfoModal 
          isOpen={showContactInfo}
          onClose={() => setShowContactInfo(false)}
          contact={{ name: contactName, avatarUrl: contactAvatar, accountId: contactAccountId, role: contactRole }}
      />
      <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} promoterId={contactId} promoterName={contactName} />

      {/* Menu de Produção (Float) */}
      {showProdMenu && (
        <div className="absolute bottom-[90px] left-4 right-4 z-[60] bg-[#1a1a1a] border border-gray-700 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold text-sm">Registrar Produção</h3>
                <button onClick={() => setShowProdMenu(false)}><X size={20} className="text-gray-500 hover:text-white" /></button>
            </div>
            {!prodType ? (
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setProdType('recarga')} className="bg-green-900/10 hover:bg-green-900/20 border border-green-500/20 p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform group">
                        <TrendingUp className="text-green-500 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-green-500 font-bold text-xs uppercase">Recarga</span>
                    </button>
                    <button onClick={() => setProdType('saque')} className="bg-red-900/10 hover:bg-red-900/20 border border-red-500/20 p-4 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform group">
                        <TrendingDown className="text-red-500 group-hover:scale-110 transition-transform" size={24} />
                        <span className="text-red-500 font-bold text-xs uppercase">Saque</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className={`p-2.5 rounded-xl flex items-center gap-2 font-bold text-xs uppercase ${prodType === 'recarga' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {prodType === 'recarga' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {prodType}
                     </div>
                     <input type="number" value={prodValue} onChange={(e) => setProdValue(e.target.value)} placeholder="0,00" className="w-full bg-[#111] border border-gray-700 rounded-2xl px-4 py-3 text-white focus:border-orange-500 outline-none font-bold text-xl placeholder-gray-600" autoFocus />
                     <button onClick={handleProductionSubmit} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-2xl active:scale-95 shadow-lg">Confirmar</button>
                     <button onClick={() => setProdType(null)} className="w-full text-gray-500 text-xs py-2 hover:text-white">Voltar</button>
                </div>
            )}
        </div>
      )}

      {/* HEADER DO CHAT */}
      <div className="flex items-center gap-2 px-4 pb-3 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-sm shrink-0 z-10">
        <button onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#252525] transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div onClick={() => setShowContactInfo(true)} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#333] overflow-hidden border border-gray-300 dark:border-white/10 cursor-pointer active:scale-95 transition-transform relative flex items-center justify-center shrink-0">
           {contactAvatar ? <img src={contactAvatar} className="w-full h-full object-cover" alt="Avatar" /> : <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">{contactName?.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="flex-1 min-w-0 ml-1">
          <h2 className="text-gray-900 dark:text-white font-bold text-sm truncate leading-tight">{contactName}</h2>
          <p className="text-[10px] text-gray-500 flex items-center gap-1.5 leading-tight mt-0.5">
            {isTyping ? <span className="text-orange-500 animate-pulse font-bold">Digitando...</span> : <>
                <span className={`w-1.5 h-1.5 rounded-full ${contactStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400 dark:bg-gray-600'}`}></span>
                {lastSeenText || 'Offline'}
            </>}
          </p>
        </div>
        {isChattingWithPromoter && (
            <button onClick={() => setShowRatingModal(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 active:scale-90 transition-transform border border-yellow-500/20">
                <Star size={18} fill="currentColor" fillOpacity={0.6} />
            </button>
        )}
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f3f4f6] dark:bg-[#050505] custom-scrollbar" style={{ backgroundImage: 'radial-gradient(rgba(128,128,128,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        {loading && messages.length === 0 ? (
            <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-orange-500" /></div>
        ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-32 opacity-30 select-none">
                <div className="w-16 h-16 bg-gray-200 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-3"><Send size={24} className="text-gray-500" /></div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Inicie a conversa</p>
            </div>
        ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} isMe={msg.sender_id === senderId} />)
        )}
        {uploading && (
            <div className="flex justify-end animate-pulse">
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2 flex items-center gap-2 text-orange-500 text-[10px] font-bold">
                    <Loader2 size={12} className="animate-spin" /> ENVIANDO MÍDIA...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="p-3 bg-white dark:bg-[#0f0f0f] border-t border-gray-200 dark:border-[#222] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        {isRecording ? (
            <div className="flex items-center gap-3 max-w-4xl mx-auto px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 animate-pulse bg-red-500/10"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div></div>
                <div className="flex-1 text-gray-900 dark:text-white font-mono font-bold text-lg animate-pulse">{formatDuration(recordingDuration)}</div>
                <button onClick={() => handleStopRecording(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                <button onClick={() => handleStopRecording(true)} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white dark:text-black shadow-lg shadow-green-500/20 active:scale-90 transition-all"><Send size={18} /></button>
            </div>
        ) : (
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                {isAssistant && (
                    <button type="button" onClick={() => setShowProdMenu(!showProdMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 mb-0.5 border ${showProdMenu ? 'bg-orange-500 text-black border-orange-600' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]'}`}>
                        <DollarSign size={20} />
                    </button>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || sending} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] active:scale-90 flex-shrink-0 mb-0.5 transition-colors hover:text-orange-500">
                    {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                </button>
                
                <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (!typingTimeoutRef.current) {
                            supabase.channel(`room:${roomId}`).send({ type: 'broadcast', event: 'typing', payload: { user_id: senderId } });
                            typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Mensagem..."
                    rows={1}
                    className="flex-1 bg-gray-50 dark:bg-[#161616] border border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-[20px] px-4 py-2.5 focus:outline-none focus:border-orange-500/50 focus:bg-white dark:focus:bg-[#0a0a0a] transition-all placeholder-gray-400 dark:placeholder-gray-600 resize-none overflow-hidden min-h-[42px] max-h-[120px] text-[15px]"
                    style={{ lineHeight: '1.4' }}
                />

                {newMessage.trim() ? (
                    <button type="button" onClick={(e) => handleSendMessage(e)} disabled={sending} className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 hover:brightness-110 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-90 transition-all flex-shrink-0">
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                    </button>
                ) : (
                    <button type="button" onClick={handleStartRecording} className="w-11 h-11 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm active:scale-90 transition-all flex-shrink-0 border border-gray-200 dark:border-[#333] hover:text-orange-500">
                        <Mic size={22} />
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
