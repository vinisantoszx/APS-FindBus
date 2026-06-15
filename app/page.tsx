'use client';

import { useState } from 'react';
import { AlertTriangle, Bell, BookOpen, BusFront, Clock, GraduationCap, Heart, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react';
import Map from '@/components/Map';

type RotaFixa = {
  id: number;
  nome: string;
  descricao: string;
  status: 'Em trânsito' | 'Atrasado' | 'Aguardando';
  eta: string;
  parada: string;
  favorita?: boolean;
};

const rotasAtivas: RotaFixa[] = [
  {
    id: 1,
    nome: 'Rota UFC Campus Quixadá',
    descricao: 'Rodoviária • Centro • UFC',
    status: 'Em trânsito',
    eta: 'Chegada estimada em 8 min',
    parada: 'Próxima parada: Rodoviária de Quixadá',
    favorita: true,
  },
  {
    id: 2,
    nome: 'Rota Universitária Centro',
    descricao: 'Centro • IFCE • Unicatólica • UFC',
    status: 'Atrasado',
    eta: 'Atraso aproximado de 12 min',
    parada: 'Próxima parada: Praça José de Barros',
    favorita: true,
  },
  {
    id: 3,
    nome: 'Rota Noturna Universitária',
    descricao: 'UFC • Terminal • Bairros',
    status: 'Aguardando',
    eta: 'Saída prevista às 18:20',
    parada: 'Ponto inicial: Campus UFC',
  },
];

export default function Home() {
  const [busca, setBusca] = useState('');

  const rotasFiltradas = rotasAtivas.filter((rota) =>
    rota.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const rotasFavoritas = rotasAtivas.filter((rota) => rota.favorita);

  const handleReportar = () => {
    alert('Protótipo visual: aqui o estudante registraria atraso, superlotação, falha mecânica ou problema de segurança.');
  };

  return (
    <main className="flex h-screen w-full bg-gray-50 overflow-hidden flex-col md:flex-row font-sans">
      <aside className="w-full md:w-[380px] bg-white shadow-xl flex flex-col z-20">
        <div className="p-6 bg-emerald-600 md:bg-emerald-700 flex items-center justify-between text-white transition-colors">
          <div className="flex items-center gap-3">
            <BusFront size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FindBus</h1>
              <p className="text-xs text-emerald-100">Transporte universitário em tempo real</p>
            </div>
          </div>
          <Bell size={20} className="cursor-pointer hover:text-emerald-200" />
        </div>

        <section className="p-4 border-b bg-emerald-50">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserRound size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Conta do estudante</p>
                <h2 className="text-base font-bold text-gray-800">Antônio Vinícius Silva Santos</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-600" />
                Universidade Federal do Ceará - Campus Quixadá
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-600" />
                Análise e Projeto de Sistemas
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Perfil estudantil verificado para rotas universitárias
              </div>
            </div>
          </div>
        </section>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar rota..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotas Favoritas</h2>
            <div className="space-y-3">
              {rotasFavoritas.map((rota) => (
                <div key={rota.id} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Heart size={16} className="text-emerald-600 fill-emerald-600 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{rota.nome}</h3>
                      <p className="text-xs text-gray-500">{rota.descricao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotas Ativas</h2>
            <div className="space-y-4">
              {rotasFiltradas.map((rota) => {
                const isDelayed = rota.status === 'Atrasado';

                return (
                  <div
                    key={rota.id}
                    className={`bg-white border rounded-lg p-4 shadow-sm transition-colors ${
                      isDelayed ? 'border-red-200' : 'hover:border-emerald-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{rota.nome}</h3>
                        <p className="text-xs text-gray-500">{rota.descricao}</p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${
                          isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {rota.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-1 gap-2">
                      {isDelayed ? (
                        <AlertTriangle size={14} className="text-red-500" />
                      ) : (
                        <Clock size={14} className="text-emerald-600" />
                      )}
                      {rota.eta}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <MapPin size={14} className="text-gray-400" /> {rota.parada}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleReportar}
            className="w-full bg-emerald-500 hover:opacity-90 text-white font-medium py-2 rounded-md shadow-sm"
          >
            Reportar Ocorrência
          </button>
        </div>
      </aside>

      <section className="flex-1 relative h-[50vh] md:h-full p-2 md:p-4 bg-gray-100">
        <Map />
      </section>
    </main>
  );
}
