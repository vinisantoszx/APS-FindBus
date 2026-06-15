'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Activity, BusFront, Map as MapIcon, Navigation, Settings } from 'lucide-react';
import Map from '@/components/Map';
import { createClient } from '@/utils/supabase/client';

type AbaAtiva = 'monitoramento' | 'veiculos' | 'rotas' | 'paradas';

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('monitoramento');
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');

  const handleSalvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const valor1 = input1.trim();
    const valor2 = input2.trim();

    if (!valor1 || !valor2) {
      alert('Preencha todos os campos antes de salvar.');
      return;
    }

    const insertResult =
      abaAtiva === 'veiculos'
        ? await supabase.from('vehicles').insert({ plate: valor1, model: valor2, capacity: 40, active: true })
        : abaAtiva === 'rotas'
          ? await supabase.from('routes').insert({ name: valor1, description: valor2 })
          : await supabase.from('stops').insert({ name: valor1, latitude: -4.97, longitude: -39.01 });

    if (insertResult.error) {
      alert('Não foi possível salvar. Verifique os dados e tente novamente.');
      console.error('Erro ao salvar cadastro:', insertResult.error.message);
      return;
    }

    alert(`${abaAtiva} cadastrado(a) com sucesso!`);
    setInput1('');
    setInput2('');
  };

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-emerald-400 border-b border-gray-700 pb-4">
          <Settings size={28} />
          <h1 className="text-xl font-bold">Gestão FindBus</h1>
        </div>
        <nav className="flex flex-col gap-4">
          <button onClick={() => setAbaAtiva('monitoramento')} className={`flex items-center gap-3 text-left ${abaAtiva === 'monitoramento' ? 'text-emerald-400' : 'text-gray-300'}`}>
            <Activity size={20} /> Monitorar Frota
          </button>
          <button onClick={() => setAbaAtiva('veiculos')} className={`flex items-center gap-3 text-left ${abaAtiva === 'veiculos' ? 'text-emerald-400' : 'text-gray-300'}`}>
            <BusFront size={20} /> Veículos
          </button>
          <button onClick={() => setAbaAtiva('rotas')} className={`flex items-center gap-3 text-left ${abaAtiva === 'rotas' ? 'text-emerald-400' : 'text-gray-300'}`}>
            <MapIcon size={20} /> Rotas
          </button>
          <button onClick={() => setAbaAtiva('paradas')} className={`flex items-center gap-3 text-left ${abaAtiva === 'paradas' ? 'text-emerald-400' : 'text-gray-300'}`}>
            <Navigation size={20} /> Paradas
          </button>
        </nav>
      </aside>

      <section className="flex-1 p-8 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 uppercase">Gerenciar {abaAtiva}</h2>

        {abaAtiva === 'monitoramento' ? (
          <div className="flex-1 rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <Map />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-xl">
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {abaAtiva === 'veiculos' ? 'Placa' : 'Nome'}
                </label>
                <input value={input1} onChange={(e) => setInput1(e.target.value)} className="w-full px-4 py-2 border rounded-md" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {abaAtiva === 'veiculos' ? 'Modelo' : 'Descrição/Referência'}
                </label>
                <input value={input2} onChange={(e) => setInput2(e.target.value)} className="w-full px-4 py-2 border rounded-md" required />
              </div>
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md">
                Salvar
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
