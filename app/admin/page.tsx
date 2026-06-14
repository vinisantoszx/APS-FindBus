'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BusFront, Map, Navigation, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidade, setCapacidade] = useState('');

  // RF15 - Cadastro de veículos
  const handleCadastrarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('vehicles').insert({
      plate: placa,
      model: modelo,
      capacity: parseInt(capacidade),
      active: true
    });

    if (!error) {
      alert("Veículo cadastrado com sucesso!");
      setPlaca(''); setModelo(''); setCapacidade('');
    } else {
      alert("Erro ao cadastrar veículo.");
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar do Administrador */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-emerald-400 border-b border-gray-700 pb-4">
          <Settings size={28} />
          <h1 className="text-xl font-bold">Gestão FindBus</h1>
        </div>
        
        <nav className="flex flex-col gap-4">
          <button className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-left">
            <BusFront size={20} /> Frota de Veículos
          </button>
          <button className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-left">
            <Map size={20} /> Rotas e Itinerários
          </button>
          <button className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-left">
            <Navigation size={20} /> Pontos de Parada
          </button>
        </nav>
      </aside>

      {/* Área Principal */}
      <section className="flex-1 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Novo Veículo (RF15)</h2>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-xl">
          <form onSubmit={handleCadastrarVeiculo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa do Ônibus</label>
              <input 
                type="text" 
                value={placa} onChange={(e) => setPlaca(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Ex: ABC-1234" required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo/Descrição</label>
              <input 
                type="text" 
                value={modelo} onChange={(e) => setModelo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Ex: Marcopolo Torino" required 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade (Passageiros)</label>
              <input 
                type="number" 
                value={capacidade} onChange={(e) => setCapacidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder="Ex: 40" required 
              />
            </div>

            <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-md transition-colors mt-4">
              Salvar Veículo
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}