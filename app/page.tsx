'use client';
import { useEffect, useState } from 'react';
import Map from '@/components/Map';
import { createClient } from '@/utils/supabase/client';
import { MapPin, Clock, BusFront, Search, AlertTriangle, Bell } from 'lucide-react';

export default function Home() {
  const supabase = createClient();
  interface Trip {
    status: string;
    eta_next_stop?: string;
  }

  interface Route {
    id: number;
    name: string;
    description?: string;
    trips?: Trip[];
  }

  const [rotas, setRotas] = useState<Route[]>([]);

  const [busca, setBusca] = useState('');

  useEffect(() => {
    const fetchRotas = async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(`
        id,
        name,
        description,
        trips(status, eta_next_stop)
      `);

      if (error) {
        console.error(error);
        return;
      }

      setRotas(data ?? []);
    };

    fetchRotas();
  }, [supabase]);

  const handleReportar = async () => {
    const desc = prompt("Descreva a ocorrência (Ex: Atraso, Quebra):");
    if (desc) {
      await supabase.from('occurrences').insert({ type: 'other', description: desc });
      alert("Ocorrência registrada!");
    }
  };

  // RF20 - Busca de rotas
  const rotasFiltradas = rotas.filter((r) =>
    (r.name ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="flex h-screen w-full bg-gray-50 overflow-hidden flex-col md:flex-row font-sans">
      <aside className="w-full md:w-80 bg-white shadow-xl flex flex-col z-20">
        <div className="p-6 bg-emerald-500 md:bg-emerald-700 flex items-center justify-between text-white transition-colors">
          <div className="flex items-center gap-3">
            <BusFront size={28} />
            <h1 className="text-2xl font-bold tracking-tight">FindBus</h1>
          </div>
          <Bell size={20} className="cursor-pointer hover:text-emerald-200" />
        </div>

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

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotas Ativas</h2>

          {rotasFiltradas.map((rota) => {
            const viagemAtiva = rota.trips?.[0];
            const isDelayed = viagemAtiva?.status === 'delayed';

            return (
              <div key={rota.id} className={`bg-white border rounded-lg p-4 shadow-sm transition-colors ${isDelayed ? 'border-red-200' : 'hover:border-emerald-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-sm">{rota.name}</h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${isDelayed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {isDelayed ? 'Atrasado' : (viagemAtiva ? 'Em trânsito' : 'Aguardando')}
                  </span>
                </div>
                {viagemAtiva && (
                  <>
                    <div className="flex items-center text-sm text-gray-600 mb-1 gap-2">
                      {isDelayed ? <AlertTriangle size={14} className="text-red-500" /> : <Clock size={14} className="text-emerald-600" />}
                      {viagemAtiva.eta_next_stop || 'Calculando...'}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 gap-2">
                      <MapPin size={14} className="text-gray-400" /> Próxima parada estimada
                    </div>
                  </>
                )}
              </div>
            );
          })}
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