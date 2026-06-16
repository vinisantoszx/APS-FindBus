'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  BusFront,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
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

type AvaliacaoForm = {
  routeId: string;
  rating: string;
  punctuality: string;
  comfort: string;
  communication: string;
  comment: string;
};

const perfilPadrao: PerfilEstudante = {
  nome: 'Estudante FindBus',
  instituicao: 'Universidade Federal do Ceará - Campus Quixadá',
  curso: 'Análise e Projeto de Sistemas',
  status: 'Perfil estudantil para rotas universitárias',
};

const avaliacaoInicial: AvaliacaoForm = {
  routeId: '',
  rating: '5',
  punctuality: '80',
  comfort: '80',
  communication: '80',
  comment: '',
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
  const [favoritandoId, setFavoritandoId] = useState<string | null>(null);
  const [avaliando, setAvaliando] = useState(false);
  const [avaliacaoForm, setAvaliacaoForm] = useState<AvaliacaoForm>(avaliacaoInicial);
  const [erro, setErro] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      setErro(null);

      try {
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
          return;
        }

        let favoriteIds = new Set<string>();

        if (user) {
          const { data: favoritesData, error: favoritesError } = await supabase
            .from('route_favorites')
            .select('route_id')
            .eq('user_id', user.id);

          if (favoritesError) {
            setErro(`As rotas carregaram, mas os favoritos não puderam ser lidos: ${favoritesError.message}`);
          } else {
            favoriteIds = new Set((favoritesData ?? []).map((favorite) => String(favorite.route_id)));
          }
        }

        const rotasFormatadas = buildRotas((routesData ?? []) as RouteRecord[], favoriteIds);
        setRotas(rotasFormatadas);

        setAvaliacaoForm((formAtual) => ({
          ...formAtual,
          routeId: formAtual.routeId || String(rotasFormatadas[0]?.id ?? ''),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido.';
        setErro(`Não foi possível carregar a página do estudante: ${message}`);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [supabase]);

  const rotasFiltradas = rotas.filter((rota) =>
    rota.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  const rotasFavoritas = rotas.filter((rota) => rota.favorita);
  const rotaSelecionadaParaAvaliacao = rotas.find((rota) => String(rota.id) === avaliacaoForm.routeId);

  const alternarFavorito = async (rota: Rota) => {
    if (!usuarioId) {
      const irParaLogin = window.confirm('Faça login para salvar suas rotas favoritas. Deseja ir para a tela de login agora?');
      if (irParaLogin) window.location.href = '/login';
      return;
    }

    setFavoritandoId(String(rota.id));

    try {
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
    } finally {
      setFavoritandoId(null);
    }
  };

  const enviarAvaliacao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rotaSelecionadaParaAvaliacao) {
      alert('Selecione uma rota para avaliar.');
      return;
    }

    setAvaliando(true);

    try {
      const { error } = await supabase.from('service_ratings').insert({
        user_id: usuarioId,
        route_id: rotaSelecionadaParaAvaliacao.id,
        rating: Number(avaliacaoForm.rating),
        punctuality: Number(avaliacaoForm.punctuality),
        comfort: Number(avaliacaoForm.comfort),
        communication: Number(avaliacaoForm.communication),
        comment: avaliacaoForm.comment.trim() || null,
      });

      if (error) {
        alert(`Erro ao enviar avaliação: ${error.message}`);
        return;
      }

      alert('Avaliação registrada com sucesso. Ela já alimenta os indicadores do admin.');
      setAvaliacaoForm({ ...avaliacaoInicial, routeId: String(rotaSelecionadaParaAvaliacao.id) });
    } finally {
      setAvaliando(false);
    }
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
    <main className="flex min-h-screen w-full flex-col bg-gray-50 font-sans md:h-screen md:flex-row md:overflow-hidden">
      <aside className="z-20 flex w-full flex-col bg-white shadow-xl md:h-full md:w-[390px]">
        <div className="flex items-center justify-between bg-emerald-600 p-5 text-white transition-colors md:bg-emerald-700 md:p-6">
          <div className="flex items-center gap-3">
            <BusFront size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FindBus</h1>
              <p className="text-xs text-emerald-100">Transporte universitário em tempo real</p>
            </div>
          </div>
          <Bell size={20} className="cursor-pointer hover:text-emerald-200" />
        </div>

        <div className="border-b bg-emerald-50 p-4">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <UserRound size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Conta do estudante</p>
                <h2 className="break-words font-bold text-gray-900">{perfil.nome}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><GraduationCap size={13} /> {perfil.instituicao}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><BookOpen size={13} /> {perfil.curso}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck size={13} /> {perfil.status}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar rota..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="w-full rounded-md bg-gray-100 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-5 p-4 md:flex-1 md:overflow-y-auto">
          {erro && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
          {carregando && <p className="text-sm text-gray-500">Carregando rotas do Supabase...</p>}

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Rotas favoritas</h2>
            <div className="space-y-3">
              {rotasFavoritas.length === 0 && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Nenhuma rota favoritada ainda.</p>}
              {rotasFavoritas.map((rota) => (
                <div key={`fav-${String(rota.id)}`} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="break-words text-sm font-semibold text-gray-900">{rota.nome}</p>
                  <p className="text-xs text-gray-500">{rota.eta}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Avaliar rota</h2>
            <form onSubmit={enviarAvaliacao} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
              <select
                value={avaliacaoForm.routeId}
                onChange={(event) => setAvaliacaoForm({ ...avaliacaoForm, routeId: event.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione uma rota</option>
                {rotas.map((rota) => (
                  <option key={String(rota.id)} value={String(rota.id)}>{rota.nome}</option>
                ))}
              </select>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Nota geral</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const nota = index + 1;
                    const selecionada = Number(avaliacaoForm.rating) >= nota;

                    return (
                      <button
                        key={nota}
                        type="button"
                        onClick={() => setAvaliacaoForm({ ...avaliacaoForm, rating: String(nota) })}
                        className={selecionada ? 'text-yellow-500' : 'text-gray-300'}
                        aria-label={`Avaliar com ${nota} estrela${nota > 1 ? 's' : ''}`}
                      >
                        <Star size={22} fill="currentColor" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <label className="block">
                  <span className="mb-1 flex justify-between"><strong>Pontualidade</strong><span>{avaliacaoForm.punctuality}%</span></span>
                  <input type="range" min="0" max="100" value={avaliacaoForm.punctuality} onChange={(event) => setAvaliacaoForm({ ...avaliacaoForm, punctuality: event.target.value })} className="w-full" />
                </label>
                <label className="block">
                  <span className="mb-1 flex justify-between"><strong>Conforto</strong><span>{avaliacaoForm.comfort}%</span></span>
                  <input type="range" min="0" max="100" value={avaliacaoForm.comfort} onChange={(event) => setAvaliacaoForm({ ...avaliacaoForm, comfort: event.target.value })} className="w-full" />
                </label>
                <label className="block">
                  <span className="mb-1 flex justify-between"><strong>Comunicação</strong><span>{avaliacaoForm.communication}%</span></span>
                  <input type="range" min="0" max="100" value={avaliacaoForm.communication} onChange={(event) => setAvaliacaoForm({ ...avaliacaoForm, communication: event.target.value })} className="w-full" />
                </label>
              </div>

              <textarea
                value={avaliacaoForm.comment}
                onChange={(event) => setAvaliacaoForm({ ...avaliacaoForm, comment: event.target.value })}
                placeholder="Comentário opcional sobre a rota"
                className="min-h-20 w-full rounded-lg border px-3 py-2 text-sm"
              />

              <button disabled={avaliando || rotas.length === 0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2 text-sm font-bold text-white disabled:opacity-60">
                <Send size={16} /> {avaliando ? 'Enviando avaliação...' : 'Enviar avaliação'}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Rotas Ativas</h2>
            <div className="space-y-4">
              {rotasFiltradas.length === 0 && !carregando && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">Nenhuma rota ativa encontrada.</p>}
              {rotasFiltradas.map((rota) => {
                const isDelayed = rota.status === 'Atrasado';
                const isFavoritando = favoritandoId === String(rota.id);

                return (
                  <div key={String(rota.id)} className={`rounded-lg border bg-white p-4 shadow-sm transition-colors ${isDelayed ? 'border-red-200' : 'hover:border-emerald-500'}`}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-bold text-gray-800">{rota.nome}</h3>
                        <p className="mt-1 break-words text-xs text-gray-500">{rota.descricao}</p>
                      </div>
                      <button
                        onClick={() => alternarFavorito(rota)}
                        disabled={isFavoritando}
                        className={`shrink-0 rounded-full p-2 disabled:opacity-60 ${rota.favorita ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}
                        aria-label={rota.favorita ? 'Remover rota dos favoritos' : 'Favoritar rota'}
                        title={rota.favorita ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                      >
                        <Heart size={16} fill={rota.favorita ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <span className={`mb-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${isDelayed ? 'bg-red-100 text-red-800' : rota.status === 'Em trânsito' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {rota.status}
                    </span>
                    <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                      {isDelayed ? <AlertTriangle size={14} className="text-red-500" /> : <Clock size={14} className="text-emerald-600" />}
                      {rota.eta}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={14} className="shrink-0 text-gray-400" /> {rota.parada}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="border-t bg-gray-50 p-4">
          <button onClick={handleReportar} className="w-full rounded-md bg-emerald-500 py-2 font-medium text-white shadow-sm hover:opacity-90">
            Reportar Ocorrência
          </button>
        </div>
      </aside>

      <section className="relative h-[55vh] min-h-[360px] bg-gray-100 p-2 md:h-full md:min-h-0 md:flex-1 md:p-4">
        <Map />
      </section>
    </main>
  );
}
