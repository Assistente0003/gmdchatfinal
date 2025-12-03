
import React, { useEffect, useState } from 'react';
import { X, Sparkles, Calendar, ArrowRight, Loader2, Megaphone, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNews();
    } else {
        setSelectedNews(null);
    }
  }, [isOpen]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (err) {
      console.error('Erro ao buscar novidades:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]">
        
        {/* Header Especial */}
        <div className="relative bg-gradient-to-r from-orange-900/40 to-[#0a0a0a] p-6 pb-4 border-b border-gray-800 shrink-0">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-black/20 rounded-full p-1"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Novidades</h2>
                    <p className="text-orange-500/80 text-xs font-bold uppercase tracking-widest">GMD Updates</p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#050505]">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
            ) : selectedNews ? (
                // DETALHES DA NOTÍCIA (EXPANDIDO)
                <div className="animate-fade-in pb-4">
                    <button 
                        onClick={() => setSelectedNews(null)}
                        className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        <ArrowLeft size={14} /> Voltar
                    </button>

                    <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
                        {selectedNews.image_url && (
                            <div className="w-full relative group bg-black">
                                <img 
                                    src={selectedNews.image_url} 
                                    alt={selectedNews.title} 
                                    className="w-full h-auto object-contain" 
                                />
                            </div>
                        )}

                        <div className="p-5">
                            <div className="flex items-center gap-2 text-orange-500 text-[10px] uppercase font-bold tracking-wider mb-3">
                                <Calendar size={12} />
                                {new Date(selectedNews.created_at).toLocaleDateString()}
                                <span className="text-gray-700">•</span>
                                <span className="text-gray-500">{new Date(selectedNews.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4 leading-tight">
                                {selectedNews.title}
                            </h3>

                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                                {selectedNews.content}
                            </div>
                        </div>
                    </div>
                </div>
            ) : news.length === 0 ? (
                // LISTA VAZIA
                <div className="text-center py-10 opacity-60">
                    <Megaphone size={32} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma novidade no momento.</p>
                </div>
            ) : (
                // LISTA DE NOTÍCIAS
                <div className="space-y-6">
                    {news.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedNews(item)}
                            className="group relative bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                            {/* Imagem (Se houver) */}
                            {item.image_url && (
                                <div className="w-full h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                                    
                                    {/* Botão Ver Mais flutuante */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-2 shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            Ler tudo <ArrowRight size={12} />
                                        </div>
                                    </div>

                                    <img 
                                        src={item.image_url} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                    />
                                </div>
                            )}

                            <div className="p-5 relative z-20">
                                {/* Data */}
                                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">
                                    <Calendar size={12} />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>

                                {/* Título */}
                                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                                    {item.title}
                                </h3>

                                {/* Texto - Truncado */}
                                <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                    {item.content}
                                </p>

                                {!item.image_url && (
                                     <div className="mt-3 text-orange-500 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Ler mais <ArrowRight size={12} />
                                     </div>
                                )}
                            </div>
                            
                            {/* Barra decorativa */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-[#0a0a0a] border-t border-gray-800 shrink-0">
            <button 
                onClick={selectedNews ? () => setSelectedNews(null) : onClose}
                className="w-full bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
                {selectedNews ? 'Voltar para Lista' : 'Fechar'}
            </button>
        </div>

      </div>
    </div>
  );
};
