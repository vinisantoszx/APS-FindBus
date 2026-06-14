'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Heart, MapPin, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function Perfil() {
  const [nome, setNome] = useState('Vinícius Santos'); // Mock inicial
  const [email, setEmail] = useState('aluno@quixada.ufc.br');

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    // RF03 - Atualização de cadastro
    // const { error } = await supabase.from('profiles').update({ name: nome }).eq('id', user_id);
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl w-full mx-auto p-6 space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <User className="text-emerald-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-700">Dados Pessoais</h2>
          </div>
          
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Universitário</label>
              <input 
                type="email" 
                value={email}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed" 
              />
            </div>
            <button type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-md transition-colors mt-4">
              <Save size={18} /> Salvar Alterações
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <Heart className="text-red-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-700">Rotas Favoritas (RF04)</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <MapPin className="text-emerald-500" size={18} />
                <span className="font-semibold text-gray-800">Centro ↔ UFC</span>
              </div>
              <button className="text-sm text-red-500 hover:underline">Remover</button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <MapPin className="text-emerald-500" size={18} />
                <span className="font-semibold text-gray-800">Terminal ↔ IFCE</span>
              </div>
              <button className="text-sm text-red-500 hover:underline">Remover</button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}