
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Loader2, Sparkles, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminNewsManagerProps {
  onClose: () => void;
}

export const AdminNewsManager: React.FC<AdminNewsManagerProps> = ({ onClose }) => {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNewsList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('news').insert({
        title,
        content,
        image_url: imageUrl || null
      });

      if (error) throw error;

      // Reset
      setTitle('');
      setContent('');
      setImageUrl('');
      fetchNews(); // Atualiza lista
    } catch (err: any) {
      alert('Erro ao publicar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta notícia?')) return;
    try {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
      setNewsList(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={20} className="text-orange-500" />
                Gerenciar Novidades
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* Form de Criação */}
            <form onSubmit={handleSubmit} className="bg-[#111] border border-gray-800 rounded-2xl p-4 mb-8">
                <h3 className="text-gray-300 font-bold text-sm mb-4">Nova Publicação</h3>
                
                <div className="space-y-3">
                    <input 
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none text-sm placeholder-gray-600"
                        placeholder="Título da Novidade"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                    
                    <textarea 
                        className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none text-sm placeholder-gray-600 resize-none h-24"
                        placeholder="Texto descritivo..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        required
                    />

                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3">
                        <ImageIcon size={18} className="text-gray-500" />
                        <input 
                            className="w-full bg-transparent text-white outline-none text-sm placeholder-gray-600"
                            placeholder="URL da Imagem (Opcional)"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Publicar Agora
                    </button>
                </div>
            </form>

            {/* Lista Existente */}
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">Histórico de Publicações</h3>
            
            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-orange-500" /></div>
            ) : newsList.length === 0 ? (
                <p className="text-gray-600 text-sm text-center italic">Nenhuma notícia postada.</p>
            ) : (
                <div className="space-y-3">
                    {newsList.map(item => (
                        <div key={item.id} className="bg-[#161616] border border-gray-800 p-3 rounded-xl flex gap-3 group">
                             {item.image_url && (
                                 <div className="w-16 h-16 rounded-lg bg-black overflow-hidden shrink-0">
                                     <img src={item.image_url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                 </div>
                             )}
                             <div className="flex-1 min-w-0">
                                 <p className="text-white font-bold text-sm truncate">{item.title}</p>
                                 <p className="text-gray-500 text-xs truncate">{item.content}</p>
                                 <p className="text-gray-600 text-[10px] mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                             </div>
                             <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                             >
                                 <Trash2 size={18} />
                             </button>
                        </div>
                    ))}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
