
import React, { useState } from 'react';
import { X, Server, Copy, Check, AlertTriangle, ExternalLink, Key } from 'lucide-react';

interface PushSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushSetupModal: React.FC<PushSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const edgeFunctionCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚠️ IMPORTANTE: Use a CHAVE DE SERVIDOR (Server Key) do mesmo projeto Firebase 
// onde você pegou o VAPID Key do frontend. Se forem projetos diferentes, não funciona.
// Pegue em: Configurações do Projeto > Cloud Messaging > API Cloud Messaging (Legada)
const FCM_SERVER_KEY = "Sua_Server_Key_Aqui_AIzaSy..."; 

console.log("Edge Function Push Notification iniciada!");

serve(async (req) => {
  try {
    const { record } = await req.json();
    const newMessage = record;

    if (!newMessage || !newMessage.receiver_id) {
        return new Response(JSON.stringify({ error: 'No record provided' }), { status: 400 });
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar token do destinatário
    const { data: userProfile, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', newMessage.receiver_id)
      .single();

    if (error || !userProfile?.fcm_token) {
      console.log("Usuário sem token ou erro:", error);
      return new Response(JSON.stringify({ message: "Usuário sem token FCM" }), { status: 200 });
    }

    // 2. Enviar para FCM (Modo Data Message - Mais robusto para PWA)
    const payload = {
      to: userProfile.fcm_token,
      // Não usamos 'notification' aqui para forçar o Service Worker a tratar
      data: {
        title: "Nova Mensagem",
        body: newMessage.type === 'image' ? '📷 Imagem' : newMessage.type === 'audio' ? '🎤 Áudio' : newMessage.content,
        url: "/",
        senderId: newMessage.sender_id,
        is_background: "true"
      }
    };

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`key=\${FCM_SERVER_KEY}\`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Resultado FCM:", data);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Erro geral:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
  `;

  const sqlTriggerCode = `
-- 1. Habilite a extensão http se ainda não estiver
create extension if not exists pg_net;

-- 2. Crie a função que chama a Edge Function ou Webhook
create or replace function public.handle_new_message()
returns trigger as $$
begin
  -- Substitua URL_DA_SUA_FUNCTION pela url da sua Edge Function no Supabase
  perform net.http_post(
    url := 'https://vvoysnafyedjrexonknx.supabase.co/functions/v1/push-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}',
    body := json_build_object('record', new)::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Crie o Trigger na tabela de mensagens
create trigger on_new_message_push
after insert on public.messages
for each row execute procedure public.handle_new_message();
  `;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server size={24} className="text-blue-500" />
                    Configuração de Push (Backend)
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    Para notificações funcionarem com o <strong>App Fechado</strong>.
                </p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0" size={24} />
                <div className="text-sm text-gray-300">
                    <p className="font-bold text-yellow-500 mb-1">Atenção às Chaves:</p>
                    <p>O <code>FCM_SERVER_KEY</code> no código abaixo deve ser do <strong>mesmo projeto Firebase</strong> que você usou para gerar o VAPID Key.</p>
                    <p className="mt-1">Se você usar chaves de projetos diferentes, o log dirá "200 OK", mas a notificação não chegará.</p>
                </div>
            </div>

            <div className="space-y-8">
                
                {/* PASSO 1 */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">1</div>
                        <h3 className="text-white font-bold">Obter Chave de Servidor (Firebase)</h3>
                    </div>
                    
                    <div className="pl-11 space-y-4">
                        <p className="text-gray-400 text-xs">
                            1. Acesse o Console do Firebase > Configurações do Projeto.<br/>
                            2. Vá na aba <strong>Cloud Messaging</strong>.<br/>
                            3. Copie a <strong>Chave do servidor</strong> (API Cloud Messaging legada). Se não estiver ativada, ative-a no menu de três pontos.
                        </p>
                    </div>
                </div>

                {/* PASSO 2 */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">2</div>
                        <h3 className="text-white font-bold">Criar Edge Function (Supabase)</h3>
                    </div>
                    <div className="pl-11">
                        <p className="text-gray-400 text-xs mb-3">
                            No painel do Supabase, vá em <strong>Edge Functions</strong>. Crie uma nova chamada <code>push-notification</code>.
                            <br/><span className="text-orange-400">IMPORTANTE:</span> Substitua <code>Sua_Server_Key_Aqui...</code> pela chave que você copiou no passo 1.
                        </p>
                        <div className="relative bg-[#111] border border-gray-800 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                            <button 
                                onClick={() => handleCopy(edgeFunctionCode, 'func')}
                                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                {copied === 'func' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                            <pre>{edgeFunctionCode}</pre>
                        </div>
                    </div>
                </div>

                {/* PASSO 3 */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">3</div>
                        <h3 className="text-white font-bold">Criar Gatilho no Banco (SQL)</h3>
                    </div>
                    <div className="pl-11">
                        <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded-xl mb-3 text-xs text-blue-200">
                            <strong>Onde achar a Chave SERVICE_ROLE?</strong><br/>
                            <a 
                                href="https://supabase.com/dashboard/project/vvoysnafyedjrexonknx/settings/api" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 underline font-bold mt-1 hover:text-blue-300"
                            >
                                <ExternalLink size={12} /> Clique aqui para abrir as Configurações de API
                            </a>
                            <br/>
                            Pegue a chave <code>service_role</code> (Role para baixo se precisar e clique em Reveal).
                        </div>
                        <p className="text-gray-400 text-xs mb-3">
                            Vá no <strong>SQL Editor</strong> do Supabase e rode este comando para conectar o banco à função. <br/>
                            <span className="text-red-400">IMPORTANTE:</span> Substitua <code>SUA_SERVICE_ROLE_KEY</code> pela chave que você pegou no link acima.
                        </p>
                        <div className="relative bg-[#111] border border-gray-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto">
                            <button 
                                onClick={() => handleCopy(sqlTriggerCode, 'sql')}
                                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                {copied === 'sql' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-white" />}
                            </button>
                            <pre>{sqlTriggerCode}</pre>
                        </div>
                    </div>
                </div>

            </div>

        </div>
        
        <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]">
            <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
                Entendi
            </button>
        </div>

      </div>
    </div>
  );
};
