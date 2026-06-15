'use client';

import { useState } from 'react';
import { Activity, AlertTriangle, BarChart3, BusFront, CheckCircle2, Clock, Map as MapIcon, Navigation, Settings, Star, UsersRound } from 'lucide-react';
import Map from '@/components/Map';

type AbaAtiva = 'monitoramento' | 'veiculos' | 'rotas' | 'paradas' | 'relatorios';

const veiculos = [
  { placa: 'QXD-2026', modelo: 'Ônibus Universitário 01', rota: 'Rota UFC Campus Quixadá', status: 'Em operação', ocupacao: '78%' },
  { placa: 'UNI-1045', modelo: 'Micro-ônibus Centro', rota: 'Rota Universitária Centro', status: 'Atrasado', ocupacao: '92%' },
  { placa: 'BUS-3310', modelo: 'Ônibus Noturno', rota: 'Rota Noturna Universitária', status: 'Aguardando saída', ocupacao: '35%' },
];

const rotas = [
  { nome: 'Rota UFC Campus Quixadá', itinerario: 'Rodoviária • Centro • UFC', eta: '8 min', status: 'Ativa' },
  { nome: 'Rota Universitária Centro', itinerario: 'Centro • IFCE • Unicatólica • UFC', eta: '12 min de atraso', status: 'Atenção' },
  { nome: 'Rota Noturna Universitária', itinerario: 'UFC • Terminal • Bairros', eta: '18:20', status: 'Programada' },
];

const paradas = [
  'Rodoviária de Quixadá',
  'Praça José de Barros',
  'IFCE Quixadá',
  'Unicatólica',
  'UFC Campus Quixadá',
];

export default function AdminDashboard() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('monitoramento');

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-72 bg-gray-950 text-white p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-emerald-400 border-b border-gray-800 pb-4">
          <Settings size={28} />
          <div>
            <h1 className="text-xl font-bold">Gestão FindBus</h1>
            <p className="text-xs text-gray-400">Painel administrativo visual</p>
          </div>
        </div>

        <nav className="flex flex-col gap-3">
          <button onClick={() => setAbaAtiva('monitoramento')} className={`flex items-center gap-3 text-left rounded-lg px-3 py-2 ${abaAtiva === 'monitoramento' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
            <Activity size={20} /> Monitoramento
          </button>
          <button onClick={() => setAbaAtiva('veiculos')} className={`flex items-center gap-3 text-left rounded-lg px-3 py-2 ${abaAtiva === 'veiculos' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
            <BusFront size={20} /> Veículos
          </button>
          <button onClick={() => setAbaAtiva('rotas')} className={`flex items-center gap-3 text-left rounded-lg px-3 py-2 ${abaAtiva === 'rotas' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
            <MapIcon size={20} /> Rotas
          </button>
          <button onClick={() => setAbaAtiva('paradas')} className={`flex items-center gap-3 text-left rounded-lg px-3 py-2 ${abaAtiva === 'paradas' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
            <Navigation size={20} /> Paradas
          </button>
          <button onClick={() => setAbaAtiva('relatorios')} className={`flex items-center gap-3 text-left rounded-lg px-3 py-2 ${abaAtiva === 'relatorios' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
            <BarChart3 size={20} /> Relatórios
          </button>
        </nav>
      </aside>

      <section className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Administrador</p>
          <h2 className="text-3xl font-bold text-gray-900">Painel de controle do transporte universitário</h2>
          <p className="text-gray-500 max-w-3xl">
            Protótipo visual para monitorar frota, rotas, pontos de parada, ocorrências e indicadores de qualidade do serviço.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <BusFront className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-500">Veículos cadastrados</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <MapIcon className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">3</p>
            <p className="text-sm text-gray-500">Rotas monitoradas</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <UsersRound className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">240</p>
            <p className="text-sm text-gray-500">Estudantes impactados</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <Star className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">4.3</p>
            <p className="text-sm text-gray-500">Avaliação média</p>
          </div>
        </div>

        {abaAtiva === 'monitoramento' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden h-[560px]">
              <div className="p-5 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Monitoramento da Frota</h3>
                  <p className="text-sm text-gray-500">Visualização dos veículos em operação no mapa</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">Tempo real</span>
              </div>
              <div className="h-[485px]">
                <Map />
              </div>
            </div>

            <div className="space-y-4">
              {veiculos.map((veiculo) => (
                <div key={veiculo.placa} className="bg-white rounded-2xl border p-5 shadow-sm">
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{veiculo.modelo}</h4>
                      <p className="text-sm text-gray-500">{veiculo.placa} • {veiculo.rota}</p>
                    </div>
                    <span className={`h-fit text-xs px-3 py-1 rounded-full font-bold ${veiculo.status === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {veiculo.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Ocupação estimada</span>
                    <strong>{veiculo.ocupacao}</strong>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: veiculo.ocupacao }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'veiculos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {veiculos.map((veiculo) => (
              <div key={veiculo.placa} className="bg-white border rounded-2xl p-6 shadow-sm">
                <BusFront className="text-emerald-600 mb-4" size={32} />
                <h3 className="text-xl font-bold text-gray-900">{veiculo.modelo}</h3>
                <p className="text-gray-500 mb-4">Placa {veiculo.placa}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Rota:</strong> {veiculo.rota}</p>
                  <p><strong>Status:</strong> {veiculo.status}</p>
                  <p><strong>Capacidade visual:</strong> {veiculo.ocupacao}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'rotas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {rotas.map((rota) => (
              <div key={rota.nome} className="bg-white border rounded-2xl p-6 shadow-sm">
                <MapIcon className="text-emerald-600 mb-4" size={32} />
                <h3 className="text-xl font-bold text-gray-900">{rota.nome}</h3>
                <p className="text-gray-500 mb-4">{rota.itinerario}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Clock size={16} /> Previsão: {rota.eta}
                </div>
                <span className="inline-flex text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{rota.status}</span>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'paradas' && (
          <div className="bg-white border rounded-2xl shadow-sm p-6 max-w-3xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pontos de parada associados às rotas</h3>
            <div className="space-y-3">
              {paradas.map((parada, index) => (
                <div key={parada} className="flex items-center gap-4 border rounded-xl p-4">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{index + 1}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{parada}</p>
                    <p className="text-sm text-gray-500">Ponto usado nas rotas universitárias de Quixadá</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'relatorios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Qualidade do serviço</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Pontualidade</span><strong>72%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[72%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Conforto</span><strong>64%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[64%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Comunicação de atrasos</span><strong>86%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[86%]" /></div>
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ocorrências recentes</h3>
              <div className="space-y-3">
                <div className="flex gap-3 border rounded-xl p-4"><AlertTriangle className="text-red-500" /><div><p className="font-semibold">Superlotação</p><p className="text-sm text-gray-500">Rota Universitária Centro</p></div></div>
                <div className="flex gap-3 border rounded-xl p-4"><Clock className="text-amber-500" /><div><p className="font-semibold">Atraso reportado</p><p className="text-sm text-gray-500">Rota UFC Campus Quixadá</p></div></div>
                <div className="flex gap-3 border rounded-xl p-4"><CheckCircle2 className="text-emerald-500" /><div><p className="font-semibold">Viagem concluída</p><p className="text-sm text-gray-500">Rota Noturna Universitária</p></div></div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
