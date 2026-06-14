'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BusFront, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // RF02 - Autenticação
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Erro ao fazer login: " + error.message);
      else alert("Login realizado com sucesso! Redirecionando...");
      // Aqui você adicionaria um router.push('/') para jogar o aluno para o mapa
    } else {
      // RF01 - Cadastro
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Erro ao cadastrar: " + error.message);
      else alert("Cadastro realizado! Verifique seu e-mail.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex flex-col items-center justify-center text-emerald-600 mb-2">
          <BusFront size={48} />
          <h1 className="text-3xl font-bold mt-2 text-gray-800">FindBus</h1>
        </div>

        <h2 className="text-xl font-semibold text-center text-gray-600">
          {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
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
            />
          </div>

          <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-md transition-colors">
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Ainda não tem conta?" : "Já possui uma conta?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-semibold hover:underline">
            {isLogin ? "Cadastre-se" : "Faça Login"}
          </button>
        </p>
      </div>
    </main>
  );
}