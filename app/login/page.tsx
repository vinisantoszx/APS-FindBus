'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusFront, Lock, Mail, UserRound } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const salvarPerfil = async (userId: string, fallbackEmail: string) => {
    const fullName = name.trim() || fallbackEmail;

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      institution: 'Universidade Federal do Ceará - Campus Quixadá',
      course: 'Análise e Projeto de Sistemas',
      role: 'student',
    });
  };

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(`Erro ao fazer login: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        await salvarPerfil(data.user.id, data.user.email ?? email);
      }

      router.push('/');
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      setMessage(`Erro ao registrar: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      await salvarPerfil(data.user.id, data.user.email ?? email);
      router.push('/');
      router.refresh();
      return;
    }

    setMessage('Conta criada. Verifique o e-mail para confirmar o cadastro antes de entrar.');
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center justify-center text-emerald-600 mb-2">
          <BusFront size={48} />
          <h1 className="text-3xl font-bold mt-2 text-gray-800">FindBus</h1>
          <p className="text-sm text-gray-500 mt-1">Acesso do estudante</p>
        </div>

        <h2 className="text-xl font-semibold text-center text-gray-600">
          {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
        </h2>

        {message && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <UserRound className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required={!isLogin}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold py-2 rounded-md transition-colors"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Registrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? 'Ainda não tem conta?' : 'Já possui uma conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage(null);
            }}
            className="text-emerald-600 font-semibold hover:underline"
          >
            {isLogin ? 'Registre-se' : 'Faça login'}
          </button>
        </p>
      </div>
    </main>
  );
}
