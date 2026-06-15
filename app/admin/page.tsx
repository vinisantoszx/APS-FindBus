'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BusFront,
  CheckCircle2,
  Clock,
  Map as MapIcon,
  Navigation,
  RefreshCw,
  Settings,
  Star,
  UsersRound,
} from 'lucide-react';
import Map from '@/components/Map';
import { createClient } from '@/utils/supabase/client';

type AbaAtiva = 'monitoramento' | 'veiculos' | 'rotas' | 'paradas' | 'relatorios';
type RecordId = string | number;

type VehicleRecord = {
  id: RecordId;
  plate: string;
  model: string;
  capacity: number;
  active: boolean;
};

type RouteRecord = {
  id: RecordId;
  name: string;
  description: string | null;
  active: boolean;
};

type StopRecord = {
  id: RecordId;
  route_id: RecordId | null;
  name: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
};

type TripRecord = {
  id: RecordId;
  route_id: RecordId | null;
  vehicle_id: RecordId | null;
  status: string;
  eta_next_stop: string | null;
};

type OccurrenceRecord = {
  id: RecordId;
  route_id: RecordId | null;
  type: string;
  description: string;
  status: string;
  created_at: string;
};

type RatingRecord = {
  rating: number;
  punctuality: number | null;
  comfort: number | null;
  communication: number | null;
};

type VehicleForm = {
  plate: string;
  model: string;
  capacity: string;
};

type RouteForm = {
  name: string;
  description: string;
};

type StopForm = {
  name: string;
  latitude: string;
  longitude: string;
  routeId: string;
};

type SupabaseClientState = {
  client: ReturnType<typeof createClient> | null;
  error: string | null;
};

const initialVehicleForm: VehicleForm = {
  plate: '',
  model: '',
  capacity: '40',
};

const initialRouteForm: RouteForm = {
  name: '',
  description: '',
};

const initialStopForm: StopForm = {
  name: '',
  latitude: '',
  longitude: '',
  routeId: '',
};

function traduzirStatus(status?: string) {
  if (status === 'delayed') return 'Atrasado';
  if (status === 'in_transit') return 'Em operação';
  if (status === 'waiting') return 'Aguardando saída';
  if (status === 'completed') return 'Concluída';
  if (status === 'cancelled') return 'Cancelada';
  return 'Sem viagem ativa';
}

function traduzirOcorrencia(type: string) {
  if (type === 'delay') return 'Atraso';
  if (type === 'crowding') return 'Superlotação';
  if (type === 'mechanical_failure') return 'Falha mecânica';
  if (type === 'security') return 'Segurança';
  return 'Ocorrência';
}

function mediaNumerica(values: Array<number | null>) {
  const validos = values.filter((value): value is number => typeof value === 'number');
  if (validos.length === 0) return 0;

  const media = Math.round(validos.reduce((sum, value) => sum + value, 0) / validos.length);
  return Math.min(100, Math.max(0, media));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erro desconhecido.';
}

function getSupabaseConnectionMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (message.toLowerCase().includes('failed to fetch')) {
    return 'Erro ao conectar ao Supabase. Verifique se o .env.local tem NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY corretos, se a URL começa com https://, se o projeto Supabase está ativo e se você reiniciou o npm run dev depois de editar o .env.local.';
  }

  return `Erro ao carregar painel: ${message}`;
}

function sameId(left: RecordId | null | undefined, right: RecordId | null | undefined) {
  if (left === null || left === undefined || right === null || right === undefined) return false;
  return String(left) === String(right);
}

export default function AdminDashboard() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('monitoramento');
  const [veiculos, setVeiculos] = useState<VehicleRecord[]>([]);
  const [rotas, setRotas] = useState<RouteRecord[]>([]);
  const [paradas, setParadas] = useState<StopRecord[]>([]);
  const [viagens, setViagens] = useState<TripRecord[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OccurrenceRecord[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<RatingRecord[]>([]);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(initialVehicleForm);
  const [routeForm, setRouteForm] = useState<RouteForm>(initialRouteForm);
  const [stopForm, setStopForm] = useState<StopForm>(initialStopForm);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [supabaseState] = useState<SupabaseClientState>(() => {
    try {
      return { client: createClient(), error: null };
    } catch (error) {
      return { client: null, error: getErrorMessage(error) };
    }
  });

  const supabase = supabaseState.client;

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    if (!supabase) {
      setErro(supabaseState.error ?? 'Não foi possível inicializar o Supabase.');
      setCarregando(false);
      return;
    }

    try {
      const [vehiclesResponse, routesResponse, stopsResponse, tripsResponse, occurrencesResponse, ratingsResponse] = await Promise.all([
        supabase.from('vehicles').select('id, plate, model, capacity, active').order('id', { ascending: true }),
        supabase.from('routes').select('id, name, description, active').order('id', { ascending: true }),
        supabase.from('stops').select('id, route_id, name, latitude, longitude, sequence_order').order('sequence_order', { ascending: true }),
        supabase.from('trips').select('id, route_id, vehicle_id, status, eta_next_stop').order('id', { ascending: true }),
        supabase.from('occurrences').select('id, route_id, type, description, status, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('service_ratings').select('rating, punctuality, comfort, communication'),
      ]);

      const primeiroErro = vehiclesResponse.error ?? routesResponse.error ?? stopsResponse.error ?? tripsResponse.error ?? occurrencesResponse.error ?? ratingsResponse.error;

      if (primeiroErro) {
        setErro(`Erro ao carregar painel: ${primeiroErro.message}`);
        return;
      }

      setVeiculos((vehiclesResponse.data ?? []) as VehicleRecord[]);
      setRotas((routesResponse.data ?? []) as RouteRecord[]);
      setParadas((stopsResponse.data ?? []) as StopRecord[]);
      setViagens((tripsResponse.data ?? []) as TripRecord[]);
      setOcorrencias((occurrencesResponse.data ?? []) as OccurrenceRecord[]);
      setAvaliacoes((ratingsResponse.data ?? []) as RatingRecord[]);
    } catch (error) {
      setErro(getSupabaseConnectionMessage(error));
    } finally {
      setCarregando(false);
    }
  }, [supabase, supabaseState.error]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const rotasPorId = useMemo(() => new Map(rotas.map((rota) => [String(rota.id), rota])), [rotas]);

  const veiculosComViagem = useMemo(
    () =>
      veiculos.map((veiculo) => {
        const viagem = viagens.find((item) => sameId(item.vehicle_id, veiculo.id) && ['in_transit', 'delayed', 'waiting'].includes(item.status));
        const rota = viagem?.route_id ? rotasPorId.get(String(viagem.route_id)) : null;

        return {
          ...veiculo,
          viagem,
          rotaNome: rota?.name ?? 'Sem rota vinculada',
          statusOperacional: traduzirStatus(viagem?.status),
        };
      }),
    [rotasPorId, veiculos, viagens],
  );

  const avaliacaoMedia = avaliacoes.length > 0
    ? (avaliacoes.reduce((sum, avaliacao) => sum + avaliacao.rating, 0) / avaliacoes.length).toFixed(1)
    : '0.0';

  const indicadoresQualidade = {
    pontualidade: mediaNumerica(avaliacoes.map((avaliacao) => avaliacao.punctuality)),
    conforto: mediaNumerica(avaliacoes.map((avaliacao) => avaliacao.comfort)),
    comunicacao: mediaNumerica(avaliacoes.map((avaliacao) => avaliacao.communication)),
  };

  const criarVeiculo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      alert(supabaseState.error ?? 'Supabase não configurado.');
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.from('vehicles').insert({
        plate: vehicleForm.plate.trim().toUpperCase(),
        model: vehicleForm.model.trim(),
        capacity: Number(vehicleForm.capacity),
        active: true,
      });

      if (error) {
        alert(`Erro ao cadastrar veículo: ${error.message}`);
        return;
      }

      setVehicleForm(initialVehicleForm);
      await carregarDados();
    } catch (error) {
      alert(getSupabaseConnectionMessage(error));
    } finally {
      setSalvando(false);
    }
  };

  const criarRota = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      alert(supabaseState.error ?? 'Supabase não configurado.');
      return;
    }

    setSalvando(true);

    try {
      const { error } = await supabase.from('routes').insert({
        name: routeForm.name.trim(),
        description: routeForm.description.trim(),
        active: true,
      });

      if (error) {
        alert(`Erro ao cadastrar rota: ${error.message}`);
        return;
      }

      setRouteForm(initialRouteForm);
      await carregarDados();
    } catch (error) {
      alert(getSupabaseConnectionMessage(error));
    } finally {
      setSalvando(false);
    }
  };

  const criarParada = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      alert(supabaseState.error ?? 'Supabase não configurado.');
      return;
    }

    const rotaSelecionada = rotas.find((rota) => String(rota.id) === stopForm.routeId);

    setSalvando(true);

    try {
      const { error } = await supabase.from('stops').insert({
        name: stopForm.name.trim(),
        latitude: Number(stopForm.latitude),
        longitude: Number(stopForm.longitude),
        route_id: rotaSelecionada?.id ?? null,
        sequence_order: paradas.length + 1,
      });

      if (error) {
        alert(`Erro ao cadastrar parada: ${error.message}`);
        return;
      }

      setStopForm(initialStopForm);
      await carregarDados();
    } catch (error) {
      alert(getSupabaseConnectionMessage(error));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50 font-sans">
      <aside className="w-72 bg-gray-950 text-white p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3 text-emerald-400 border-b border-gray-800 pb-4">
          <Settings size={28} />
          <div>
            <h1 className="text-xl font-bold">Gestão FindBus</h1>
            <p className="text-xs text-gray-400">Painel administrativo funcional</p>
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
            Dados carregados do Supabase para monitorar frota, rotas, pontos de parada, ocorrências e indicadores de qualidade.
          </p>
        </div>

        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Não foi possível carregar os dados do painel.</p>
            <p className="mt-1">{erro}</p>
            <button onClick={carregarDados} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 font-semibold text-red-800 hover:bg-red-200">
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        )}
        {carregando && <div className="mb-6 rounded-xl border bg-white p-4 text-sm text-gray-500">Carregando dados do painel...</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <BusFront className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">{veiculos.length}</p>
            <p className="text-sm text-gray-500">Veículos cadastrados</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <MapIcon className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">{rotas.length}</p>
            <p className="text-sm text-gray-500">Rotas monitoradas</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <UsersRound className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">{paradas.length}</p>
            <p className="text-sm text-gray-500">Pontos de parada</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <Star className="text-emerald-600 mb-3" />
            <p className="text-3xl font-bold text-gray-900">{avaliacaoMedia}</p>
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
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">Supabase</span>
              </div>
              <div className="h-[485px]">
                <Map />
              </div>
            </div>

            <div className="space-y-4">
              {veiculosComViagem.length === 0 && <p className="rounded-2xl border bg-white p-5 text-sm text-gray-500">Nenhum veículo encontrado.</p>}
              {veiculosComViagem.map((veiculo) => (
                <div key={String(veiculo.id)} className="bg-white rounded-2xl border p-5 shadow-sm">
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{veiculo.model}</h4>
                      <p className="text-sm text-gray-500">{veiculo.plate} • {veiculo.rotaNome}</p>
                    </div>
                    <span className={`h-fit text-xs px-3 py-1 rounded-full font-bold ${veiculo.statusOperacional === 'Atrasado' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {veiculo.statusOperacional}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Capacidade cadastrada</span>
                    <strong>{veiculo.capacity} lugares</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'veiculos' && (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <form onSubmit={criarVeiculo} className="bg-white border rounded-2xl p-6 shadow-sm h-fit space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Cadastrar veículo</h3>
              <input value={vehicleForm.plate} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value })} placeholder="Placa" className="w-full border rounded-lg px-3 py-2" required />
              <input value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} placeholder="Modelo" className="w-full border rounded-lg px-3 py-2" required />
              <input value={vehicleForm.capacity} onChange={(event) => setVehicleForm({ ...vehicleForm, capacity: event.target.value })} type="number" min="1" placeholder="Capacidade" className="w-full border rounded-lg px-3 py-2" required />
              <button disabled={salvando || !supabase} className="w-full bg-gray-900 text-white font-bold rounded-lg py-2 disabled:opacity-60">Salvar veículo</button>
            </form>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {veiculosComViagem.map((veiculo) => (
                <div key={String(veiculo.id)} className="bg-white border rounded-2xl p-6 shadow-sm">
                  <BusFront className="text-emerald-600 mb-4" size={32} />
                  <h3 className="text-xl font-bold text-gray-900">{veiculo.model}</h3>
                  <p className="text-gray-500 mb-4">Placa {veiculo.plate}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Rota:</strong> {veiculo.rotaNome}</p>
                    <p><strong>Status:</strong> {veiculo.statusOperacional}</p>
                    <p><strong>Capacidade:</strong> {veiculo.capacity} lugares</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {abaAtiva === 'rotas' && (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <form onSubmit={criarRota} className="bg-white border rounded-2xl p-6 shadow-sm h-fit space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Cadastrar rota</h3>
              <input value={routeForm.name} onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })} placeholder="Nome da rota" className="w-full border rounded-lg px-3 py-2" required />
              <textarea value={routeForm.description} onChange={(event) => setRouteForm({ ...routeForm, description: event.target.value })} placeholder="Itinerário ou descrição" className="w-full border rounded-lg px-3 py-2 min-h-24" required />
              <button disabled={salvando || !supabase} className="w-full bg-gray-900 text-white font-bold rounded-lg py-2 disabled:opacity-60">Salvar rota</button>
            </form>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {rotas.map((rota) => {
                const viagem = viagens.find((item) => sameId(item.route_id, rota.id) && ['in_transit', 'delayed', 'waiting'].includes(item.status));

                return (
                  <div key={String(rota.id)} className="bg-white border rounded-2xl p-6 shadow-sm">
                    <MapIcon className="text-emerald-600 mb-4" size={32} />
                    <h3 className="text-xl font-bold text-gray-900">{rota.name}</h3>
                    <p className="text-gray-500 mb-4">{rota.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock size={16} /> Previsão: {viagem?.eta_next_stop ?? 'Não informada'}
                    </div>
                    <span className="inline-flex text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{rota.active ? 'Ativa' : 'Inativa'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {abaAtiva === 'paradas' && (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
            <form onSubmit={criarParada} className="bg-white border rounded-2xl p-6 shadow-sm h-fit space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Cadastrar parada</h3>
              <input value={stopForm.name} onChange={(event) => setStopForm({ ...stopForm, name: event.target.value })} placeholder="Nome da parada" className="w-full border rounded-lg px-3 py-2" required />
              <select value={stopForm.routeId} onChange={(event) => setStopForm({ ...stopForm, routeId: event.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">Sem rota vinculada</option>
                {rotas.map((rota) => <option key={String(rota.id)} value={String(rota.id)}>{rota.name}</option>)}
              </select>
              <input value={stopForm.latitude} onChange={(event) => setStopForm({ ...stopForm, latitude: event.target.value })} type="number" step="any" placeholder="Latitude" className="w-full border rounded-lg px-3 py-2" required />
              <input value={stopForm.longitude} onChange={(event) => setStopForm({ ...stopForm, longitude: event.target.value })} type="number" step="any" placeholder="Longitude" className="w-full border rounded-lg px-3 py-2" required />
              <button disabled={salvando || !supabase} className="w-full bg-gray-900 text-white font-bold rounded-lg py-2 disabled:opacity-60">Salvar parada</button>
            </form>
            <div className="bg-white border rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pontos de parada cadastrados</h3>
              <div className="space-y-3">
                {paradas.length === 0 && <p className="text-sm text-gray-500">Nenhum ponto de parada encontrado.</p>}
                {paradas.map((parada, index) => (
                  <div key={String(parada.id)} className="flex items-center gap-4 border rounded-xl p-4">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{index + 1}</div>
                    <div>
                      <p className="font-semibold text-gray-800">{parada.name}</p>
                      <p className="text-sm text-gray-500">{parada.route_id ? rotasPorId.get(String(parada.route_id))?.name : 'Sem rota vinculada'} • {parada.latitude}, {parada.longitude}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'relatorios' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Qualidade do serviço</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Pontualidade</span><strong>{indicadoresQualidade.pontualidade}%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${indicadoresQualidade.pontualidade}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Conforto</span><strong>{indicadoresQualidade.conforto}%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${indicadoresQualidade.conforto}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span>Comunicação de atrasos</span><strong>{indicadoresQualidade.comunicacao}%</strong></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${indicadoresQualidade.comunicacao}%` }} /></div>
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ocorrências recentes</h3>
              <div className="space-y-3">
                {ocorrencias.length === 0 && <p className="text-sm text-gray-500">Nenhuma ocorrência registrada.</p>}
                {ocorrencias.map((ocorrencia) => (
                  <div key={String(ocorrencia.id)} className="flex gap-3 border rounded-xl p-4">
                    {ocorrencia.status === 'resolved' ? <CheckCircle2 className="text-emerald-500" /> : ocorrencia.type === 'delay' ? <Clock className="text-amber-500" /> : <AlertTriangle className="text-red-500" />}
                    <div>
                      <p className="font-semibold">{traduzirOcorrencia(ocorrencia.type)}</p>
                      <p className="text-sm text-gray-500">{ocorrencia.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{ocorrencia.route_id ? rotasPorId.get(String(ocorrencia.route_id))?.name : 'Sem rota vinculada'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
