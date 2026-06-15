'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, BookOpen, BusFront, Clock, GraduationCap, Heart, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react';
import Map from '@/components/Map';
import { createClient } from '@/utils/supabase/client';

type StatusRota = 'Em trânsito' | 'Atrasado' | 'Aguardando';
type RecordId = string | number;

type TripRecord = {
  status: string | null;
  eta_next_stop: string | null;
};

type RouteRecord = {
  id: RecordId;
  name: string;
  description: string | null;
  active: boolean | null;
  trips: TripRecord[] | null;
};

type Rota = {
  id: RecordId;
  nome: string;
  descricao: string;
  status: StatusRota;
  eta: string;
  parada: string;
  favorita: boolean;
};

type PerfilEstudante = {
  nome: string;
  instituicao: string;
  curso: string;
  status: string;
};

const perfilPadrao: PerfilEstudante = {
  nome: 'Estudante FindBus',
  instituicao: 'Universidade Federal do Ceará - Campus Quixadá',
  curso: 'Análise e Projeto de Sistemas',
  status: 'Perfil estudantil para rotas universitárias',
};

function formatStatus(status?: string | null): StatusRota {
  if (status === 'delayed') return 'Atrasado';
  if (status === 'in_transit') return 'Em trânsito';
  return 'Aguardando';
}

function formatEta(status: StatusRota, eta?: string | null) {
  if (eta) return eta;
  if (status === 'Atrasado') return 'Atraso em verificação';
  if (status === 'Em trânsito') return 'Chegada em atualização';
  return 'Saída aguardando confirmação';
}

function buildRotas(routes: RouteRecord[], favoriteIds: Set<string>): Rota[] {
  return routes.map((rota) => {
    const viagemAtual = rota.trips?.[0];
    const status = formatStatus(viagemAtual?.status);

    return {
      id: rota.id,
      nome: rota.name,
      descricao: rota.description ?? 'Itinerário ainda não informado',
      status,
      eta: formatEta(status, viagemAtual?.eta_next_stop),
      parada: status === 'Aguardando' ? 'Aguardando início da rota' : 'Próxima parada em atualização',
      favorita: favoriteIds.has(String(rota.id)),
    };
  });
}

export default function Home() {
  const [busca, setBusca] = useState('');
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [perfil, setPerfil] = useState<PerfilEstudante>(perfilPadrao);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setUsuarioId(user?.id ?? null);

      if (user) {
        const metadata = user.user_metadata as { full_name?: string; name?: string };
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, institution, course')
          .eq('id', user.id)
          .maybeSingle();

        setPerfil({
          nome: profile?.full_name ?? metadata.full_name ?? metadata.name ?? user.email ?? perfilPadrao.nome,
          instituicao: profile?.institution ?? perfilPadrao.instituicao,
          curso: profile?.course ?? perfilPadrao.curso,
          status: 'Perfil estudantil verificado para rotas universitárias',
        });
      } else {
        setPerfil(perfilPadrao);
      }

      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('id, name, description, active, trips(status, eta_next_stop)')
        .eq('active', true)
        .order('id', { ascending: true });

      if (routesError) {
        setErro(`Não foi possível carregar as rotas: ${routesError.message}`);
        setRotas([]);
        setCarregando(false);
        return;
      }

      let favoriteIds = new Set<string>();

      if (user) {
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('route_favorites')
          .select('route_id')
          .eq('user_id', user.id);

        if (!favoritesError) {
          favoriteIds = new Set((favoritesData ?? []).map((favorite) => String(favorite.route_id)));
        }
      }

      setRotas(buildRotas((routesData ?? []) as RouteRecord[], favoriteIds));
      setCarregando(false);
    };

    carregarDados();
  }, [supabase]);

  const rotasFiltradas = rotas.filter((rota) =>
    rota.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const rotasFavoritas = rotas.filter((rota) => rota.favorita);

  const alternarFavorito = async (rota: Rota) => {
    if (!usuarioId) {
      alert('Faça login para salvar rotas favoritas no banco de dados.');
      return;
    }

    if (rota.favorita) {
      const { error } = await supabase
        .from('route_favorites')
        .delete()
        .eq('user_id', usuarioId)
        .eq('route_id', rota.id);

      if (error) {
        alert(`Erro ao remover favorito: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase
        .from('route_favorites')
        .insert({ user_id: usuarioId, route_id: rota.id });

      if (error) {
        alert(`Erro ao salvar favorito: ${error.message}`);
        return;
      }
    }

    setRotas((rotasAtuais) =>
      rotasAtuais.map((item) =>
        String(item.id) === String(rota.id) ? { ...item, favorita: !item.favorita } : item,
      ),
    );
  };

  const handleReportar = async () => {
    const descricao = prompt('Descreva a ocorrência: atraso, superlotação, falha mecânica ou problema de segurança.');

    if (!descricao?.trim()) return;

    const { error } = await supabase.from('occurrences').insert({
      user_id: usuarioId,
      type: 'other',
      description: descricao.trim(),
      status: 'open',
    });

    if (error) {
      alert(`Erro ao registrar ocorrência: ${error.message}`);
      return;
    }

    alert('Ocorrência registrada com sucesso.');
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

        <div className="p-4 border-b bg-emerald-50">
          <div className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserRound size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Conta do estudante</p>
                <h2 className="font-bold text-gray-900">{perfil.nome}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><GraduationCap size={13} /> {perfil.instituicao}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><BookOpen size={13} /> {perfil.curso}</p>
                <p className="text-xs text-emerald-700 flex items-center gap-1 mt-2"><ShieldCheck size={13} /> {perfil.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar rota..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {erro && <p className="text-sm bg-red-50 text-red-700 border border-red-100 p-3 rounded-lg">{erro}</p>}
          {carregando && <p className="text-sm text-gray-500">Carregando rotas do Supabase...</p>}

          <section>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotas favoritas</h2>
            <div className="space-y-3">
              {rotasFavoritas.length === 0 && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Nenhuma rota favoritada ainda.</p>}
              {rotasFavoritas.map((rota) => (
                <div key={`fav-${String(rota.id)}`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="font-semibold text-gray-900 text-sm">{rota.nome}</p>
                  <p className="text-xs text-gray-500">{rota.eta}</p>
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
                  <div key={String(rota.id)} className={`bg-white border rounded-lg p-4 shadow-sm transition-colors ${isDelayed ? 'border-red-200' : 'hover:border-emerald-500'}`}>
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{rota.nome}</h3>
                        <p className="text-xs text-gray-500 mt-1">{rota.descricao}</p>
                      </div>
                      <button onClick={() => alternarFavorito(rota)} className={`shrink-0 rounded-full p-2 ${rota.favorita ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`} aria-label="Favoritar rota">
                        <Heart size={16} fill={rota.favorita ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <span className={`inline-flex text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider mb-3 ${isDelayed ? 'bg-red-100 text-red-800' : rota.status === 'Em trânsito' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {rota.status}
                    </span>
                    <div className="flex items-center text-sm text-gray-600 mb-1 gap-2">
                      {isDelayed ? <AlertTriangle size={14} className="text-red-500" /> : <Clock size={14} className="text-emerald-600" />}
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
          <button onClick={handleReportar} className="w-full bg-emerald-500 hover:opacity-90 text-white font-medium py-2 rounded-md shadow-sm">
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
