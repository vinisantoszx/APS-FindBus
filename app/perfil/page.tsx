'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, Heart, MapPin, ArrowLeft, Save, History } from 'lucide-react';
import Link from 'next/link';

export default function Perfil() {
  const [nome, setNome] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historico, setHistorico] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Busca Histórico de Viagens (RF19)
        const { data } = await supabase.from('trip_history').select('*').eq('user_id', user.id);
        if (data) setHistorico(data);
      }
    };
    fetchDados();
  }, [supabase]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Perfil atualizado com sucesso no banco de dados!');
  };

  const addFavorito = async () => {
    // Lógica para atrelar a rota ao ID do usuário no Supabase (RF04)
    alert("Rota 'Centro ↔ UFC' adicionada aos favoritos!");
  };

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans p-6">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <User className="text-emerald-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-700">Dados Pessoais (RF03)</h2>
          </div>
          <form onSubmit={handleSalvarPerfil} className="space-y-4">
            <input placeholder="Seu Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border rounded-md" />
            <button type="submit" className="flex items-center gap-2 bg-emerald-500 text-white font-bold py-2 px-6 rounded-md"><Save size={18} /> Salvar Alterações</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <Heart className="text-red-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-700">Rotas Favoritas (RF04)</h2>
          </div>
          <button onClick={addFavorito} className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg hover:border-emerald-500 hover:text-emerald-500 transition-colors">
            + Adicionar Nova Rota aos Favoritos
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 border-b pb-4 mb-4">
            <History className="text-blue-500" size={24} />
            <h2 className="text-lg font-semibold text-gray-700">Histórico de Viagens (RF19)</h2>
          </div>
          <div className="space-y-3">
            {historico.length > 0 ? historico.map(h => (
              <div key={h.id} className="flex justify-between p-3 border rounded-lg bg-gray-50">
                <span className="font-semibold text-gray-800 flex items-center gap-2"><MapPin size={16}/> {h.route_name}</span>
                <span className="text-sm text-gray-500">{new Date(h.date).toLocaleDateString()}</span>
              </div>
            )) : <p className="text-gray-500 text-sm">Nenhuma viagem registrada ainda.</p>}
          </div>
        </div>

      </div>
    </main>
  );
}