'use client';
import Map from '@/components/Map';
import { supabase } from '@/lib/supabase';
import { MapPin, Clock, BusFront, Search } from 'lucide-react';

export default function Home() {
  
  const handleReportarOcorrencia = async () => {
    const descricao = prompt("Descreva a ocorrência (Ex: Atraso, Superlotação, Quebra):");
    
    if (descricao) {
      const { error } = await supabase.from('occurrences').insert({
        user_id: null, // Substitua pelo ID real quando implementar o login
        route_id: null, 
        type: 'other',
        description: descricao
      });

      if (!error) {
        alert("Ocorrência registrada! A secretaria foi notificada.");
      } else {
        alert("Erro ao registrar ocorrência no banco de dados.");
      }
    }
  };

  return (
    <main className="flex h-screen w-full bg-gray-50 overflow-hidden flex-col md:flex-row font-sans">
      <aside className="w-full md:w-80 bg-white shadow-xl flex flex-col z-20">
        <div className="p-6 bg-emerald-500 md:bg-emerald-700 flex items-center gap-3 text-white transition-colors">
          <BusFront size={28} />
          <h1 className="text-2xl font-bold tracking-tight">FindBus</h1>
        </div>

        <div className="p-4 border-b">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="text" placeholder="Buscar rota ou parada..." className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rotas Ativas</h2>

          <div className="bg-white border rounded-lg p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 text-sm">Centro ↔ UFC</h3>
              <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">Em trânsito</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-1 gap-2">
              <Clock size={14} className="text-emerald-600"/> Próximo: Calculando...
            </div>
            <div className="flex items-center text-sm text-gray-600 gap-2">
              <MapPin size={14} className="text-gray-400"/> Próxima: Entrada Campus
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
            <button 
                onClick={handleReportarOcorrencia}
                className="w-full bg-emerald-500 md:bg-emerald-700 hover:opacity-90 text-white font-medium py-2 rounded-md transition-colors flex justify-center items-center gap-2 text-sm shadow-sm"
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