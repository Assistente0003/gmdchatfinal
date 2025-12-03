
import React, { useState } from 'react';
import { X, Check, Star, Zap, Crown } from 'lucide-react';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  if (!isOpen) return null;

  const cycleLabels = {
    weekly: 'por semana',
    monthly: 'por mês',
    yearly: 'por ano'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header - Fixed */}
        <div className="relative z-10 p-4 pb-0 flex justify-end bg-[#0a0a0a]">
             <button 
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Escolha seu Plano</h2>
            <p className="text-gray-400 text-sm">Potencialize seus resultados com ferramentas exclusivas.</p>
          </div>

          {/* Toggle Billing Cycle */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#111] p-1 rounded-xl border border-gray-800 flex gap-1">
                <button 
                    onClick={() => setBillingCycle('weekly')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === 'weekly' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Semanal
                </button>
                <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === 'monthly' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Mensal
                </button>
                <button 
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === 'yearly' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Anual
                </button>
            </div>
          </div>

          {/* Plans */}
          <div className="space-y-6 mb-8">
            
            {/* Plano Básico (Azul) */}
            <div className="rounded-2xl border border-blue-900/30 bg-[#050a14] overflow-hidden transition-all hover:border-blue-900/50">
              <div className="p-5 border-b border-blue-900/30 bg-blue-900/10 flex justify-between items-center">
                <h3 className="font-bold text-blue-400 text-lg flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  Plano Básico
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3 mb-6">
                  {[
                    '200 contatos',
                    '0 assistentes',
                    'Chat profissional',
                    'Relatórios básicos',
                    'Suporte padrão'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-blue-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-blue-900/20 text-center">
                  <div className="text-blue-300 font-bold text-2xl">
                    R$ {billingCycle === 'weekly' ? '24,90' : billingCycle === 'monthly' ? '79,90' : '699,00'}
                  </div>
                  <div className="text-blue-500/60 text-xs font-medium uppercase tracking-wide">
                    {cycleLabels[billingCycle]}
                  </div>
                </div>
              </div>
            </div>

            {/* Plano Comercial (Verde) - Mais Vendido */}
            <div className="rounded-2xl border border-green-900/50 bg-[#051408] overflow-hidden relative transform scale-[1.02] shadow-xl shadow-green-900/10 transition-all hover:border-green-900/70">
              <div className="absolute top-0 right-0 bg-green-600 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md z-10">
                MAIS VENDIDO
              </div>
              <div className="p-5 border-b border-green-900/30 bg-green-900/10">
                <h3 className="font-bold text-green-400 text-lg flex items-center gap-2">
                  <Zap size={18} className="text-green-500 fill-current" />
                  Plano Comercial
                </h3>
              </div>
              <div className="p-5">
                <ul className="space-y-3 mb-6">
                  {[
                    '500 contatos',
                    '1 assistente',
                    'Relatórios completos',
                    'Dashboard de desempenho',
                    'Notificações automáticas'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-green-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-green-900/20 text-center">
                  <div className="text-green-300 font-bold text-3xl">
                    R$ {billingCycle === 'weekly' ? '34,90' : billingCycle === 'monthly' ? '99,90' : '899,00'}
                  </div>
                  <div className="text-green-500/60 text-xs font-medium uppercase tracking-wide">
                    {cycleLabels[billingCycle]}
                  </div>
                </div>
              </div>
            </div>

            {/* Plano Premium (Roxo) */}
            <div className="rounded-2xl border border-purple-900/50 bg-[#100514] overflow-hidden relative transition-all hover:border-purple-900/70">
              <div className="p-5 border-b border-purple-900/30 bg-purple-900/10">
                <h3 className="font-bold text-purple-400 text-lg flex items-center gap-2">
                  <Crown size={18} className="text-purple-500 fill-current" />
                  Plano Premium
                </h3>
                <p className="text-xs text-purple-400/60 mt-1">Para profissionais</p>
              </div>
              <div className="p-5">
                <ul className="space-y-3 mb-4">
                  {[
                    'Contatos ilimitados',
                    'Até 5 assistentes',
                    'Estatísticas avançadas',
                    'Suporte prioritário',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-200">
                      <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Check size={10} className="text-purple-500" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mb-6 bg-purple-900/10 rounded-xl p-4 border border-purple-900/20">
                    <p className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-1.5">
                        <Star size={12} className="fill-purple-300" /> Acesso antecipado às novidades:
                    </p>
                    <ul className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pl-1">
                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> Lives</li>
                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> Rifas</li>
                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> Loja</li>
                        <li className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> Farm / Game</li>
                        <li className="flex items-center gap-1.5 col-span-2"><div className="w-1 h-1 bg-purple-500 rounded-full"></div> Moeda Virtual (GMD)</li>
                    </ul>
                </div>
                
                <div className="pt-4 border-t border-purple-900/20 text-center">
                  <div className="text-purple-300 font-bold text-3xl">
                    R$ {billingCycle === 'weekly' ? '49,90' : billingCycle === 'monthly' ? '129,90' : '1.199,00'}
                  </div>
                  <div className="text-purple-500/60 text-xs font-medium uppercase tracking-wide">
                    {cycleLabels[billingCycle]}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div className="text-center bg-[#0f0f0f] p-5 rounded-2xl border border-gray-800 mb-4">
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Para assinar, crie sua conta e entre em contato com o suporte:
            </p>
            
            <div className="bg-black border border-gray-800 rounded-lg py-3 px-6 mb-3 inline-block shadow-inner">
              <span className="font-mono text-orange-500 font-bold text-lg tracking-widest"># 102030</span>
            </div>
            
            <p className="text-[10px] text-gray-600">
              Copie este ID e adicione na aba "Chat" após o cadastro.
            </p>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-all shadow-lg"
          >
            Entendi, Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
