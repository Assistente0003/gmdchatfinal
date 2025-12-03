
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Download, Loader2, AlertCircle } from 'lucide-react';
import { InputField } from './InputField';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

interface LoginFormProps {
  onSwitch: () => void;
  onForgotPassword: () => void;
  onInstallClick: () => void; // Recebe a função do App.tsx
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitch, onForgotPassword, onInstallClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Nota: Supabase v2 configura persistência na inicialização do cliente.
      // O padrão é LocalStorage (Manter conectado).
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in relative">
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo</h2>
        <p className="text-gray-400 text-sm">Insira suas credenciais para acessar.</p>
      </div>

      <form onSubmit={handleLogin}>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <InputField 
          label="Email" 
          placeholder="seu@email.com" 
          icon={<Mail size={18} />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <InputField 
          label="Senha" 
          placeholder="......" 
          icon={<Lock size={18} />}
          isPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between mb-8 text-sm">
          <label className="flex items-center cursor-pointer group select-none">
            <div className="relative">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className="w-5 h-5 border-2 border-gray-600 rounded bg-[#121212] peer-checked:bg-orange-600 peer-checked:border-orange-600 transition-colors"></div>
              <svg className="absolute w-3 h-3 text-black left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="ml-2 text-gray-300 group-hover:text-white transition-colors">Manter conectado</span>
          </label>
          
          <button 
            type="button" 
            onClick={onForgotPassword}
            className="text-orange-500 hover:text-orange-400 font-medium transition-colors hover:underline"
          >
            Esqueci a senha
          </button>
        </div>

        <Button type="submit" className="mb-8" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar <ArrowRight size={18} />
            </>
          )}
        </Button>

        <div className="text-center text-sm mb-12">
          <span className="text-gray-400">Não tem conta? </span>
          <button 
            type="button" 
            onClick={onSwitch}
            className="text-orange-500 font-bold hover:text-orange-400 hover:underline transition-all"
          >
            Criar agora
          </button>
        </div>

        <div className="flex justify-center">
          <button 
            type="button" 
            onClick={onInstallClick}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-800 text-gray-400 text-sm hover:border-gray-600 hover:bg-white/5 hover:text-white transition-all group"
          >
            <Download size={16} className="group-hover:text-yellow-500 transition-colors" />
            Instalar Aplicativo
          </button>
        </div>
      </form>
    </div>
  );
};
