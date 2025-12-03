
import React, { useState } from 'react';
import { Mail, Lock, User, Hash, ArrowRight, Megaphone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { InputField } from './InputField';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { PlansModal } from './PlansModal';

interface RegisterFormProps {
  onSwitch: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitch }) => {
  const [fullName, setFullName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  // Função para limpar o ID (apenas números)
  const cleanNumber = (value: string) => value.replace(/[^0-9]/g, '');

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountId(cleanNumber(e.target.value));
  };

  // Garante limpeza ao colar texto formatado
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    setAccountId(cleanNumber(pastedData));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação de Email (Apenas Gmail)
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Apenas endereços @gmail.com são permitidos.');
      setLoading(false);
      return;
    }

    // Validação básica
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    if (accountId.length < 4) {
      setError('O ID da conta deve ter pelo menos 4 números.');
      setLoading(false);
      return;
    }

    try {
      // 0. Verifica se o ID da Conta já está em uso na tabela de perfis
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('account_id', accountId)
        .maybeSingle();

      if (existingUser) {
        setError('Este ID da Conta já está em uso. Escolha outro.');
        setLoading(false);
        return;
      }

      // 1. Cria o usuário na autenticação (Supabase Auth)
      // O Trigger SQL configurado no banco vai pegar esses dados e criar a linha na tabela 'profiles' automaticamente.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_id: accountId, // O Trigger usa isso para preencher a tabela
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setSuccess(true);
      }
      
    } catch (err: any) {
      console.error(err);
      
      let errorMsg = 'Erro ao criar conta. Tente novamente.';
      if (typeof err === 'string') errorMsg = err;
      else if (err?.message) {
        if (err.message.includes('already registered')) {
          errorMsg = 'Este email já está cadastrado.';
        } else {
          errorMsg = err.message;
        }
      } 
      else if (err?.error_description) errorMsg = err.error_description;
      else errorMsg = JSON.stringify(err);

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in text-center py-4">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">Cadastro Realizado!</h2>
        
        <div className="bg-[#121212] border border-gray-800 rounded-xl p-4 mb-6 text-left">
          <p className="text-gray-300 text-sm mb-2">
            Conta criada com sucesso para o ID:
          </p>
          <p className="text-orange-500 font-bold font-mono text-lg mb-2">
            #{accountId}
          </p>
          <hr className="border-gray-800 my-2"/>
          <p className="text-gray-400 text-xs">
            Verifique seu email ({email}) para confirmar a conta antes de entrar.
          </p>
        </div>
        
        <Button onClick={onSwitch} variant="primary">
          <ArrowRight size={18} /> Ir para o Login
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">
      <PlansModal isOpen={showPlans} onClose={() => setShowPlans(false)} />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Criar Conta</h2>
        <p className="text-gray-400 text-sm">Preencha os dados abaixo.</p>
      </div>

      <form onSubmit={handleRegister}>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-sm text-left">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <InputField 
          label="Nome Completo" 
          placeholder="Ex: João Silva" 
          icon={<User size={18} />}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <div className="mb-5">
            <InputField 
            label="ID da Conta (Seu identificador único)" 
            placeholder="Ex: 123456" 
            icon={<Hash size={18} />}
            type="tel"
            pattern="[0-9]*"
            value={accountId}
            onChange={handleIdChange}
            onPaste={handlePaste}
            className="mb-1"
            required
            />
            <p className="text-[10px] text-gray-500 pl-1">
                * Este será seu número para ser encontrado no Chat e Promoções.
            </p>
        </div>
        
        <div className="mb-5">
            <InputField 
              label="Email (@gmail.com)" 
              placeholder="seu@gmail.com" 
              icon={<Mail size={18} />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-1"
              required
            />
            <p className="text-[10px] text-gray-500 pl-1">
                * Obrigatório o uso de e-mail <strong>@gmail.com</strong>.
            </p>
        </div>
        
        <InputField 
          label="Senha (Mín. 6 dígitos)" 
          placeholder="......" 
          icon={<Lock size={18} />}
          isPassword
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-end mb-6">
          <button 
            type="button" 
            onClick={() => setShowPlans(true)}
            className="flex items-center gap-2 text-sm text-orange-500 font-medium hover:text-orange-400 transition-colors"
          >
            <Megaphone size={14} />
            Seja um Promotor? <span className="underline">Ver planos</span>
          </button>
        </div>

        <Button type="submit" className="mb-6" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Configurando conta...
            </>
          ) : (
            <>
              Cadastrar <ArrowRight size={18} />
            </>
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-400">Já tem uma conta? </span>
          <button 
            type="button" 
            onClick={onSwitch}
            className="text-orange-500 font-bold hover:text-orange-400 hover:underline transition-all"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
};
