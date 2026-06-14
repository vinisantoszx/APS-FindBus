'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BusFront, MapPin, CheckCircle } from 'lucide-react';

export default function MotoristaDashboard() {
  const [isTracking, setIsTracking] = useState(false);
  const [tripId, setTripId] = useState('INSIRA_AQUI_O_ID_DA_VIAGEM_DO_BANCO'); 
  // No mundo real, esse ID vem após o motorista fazer login e selecionar a rota.

  const startTracking = async () => {
    setIsTracking(true);
    
    // Atualiza o status para Em Trânsito (RF13)
    await supabase.from('trips').update({ status: 'in_transit' }).eq('id', tripId);

    // Inicia a captura do GPS do celular (RF14)
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        async (position) => {
          await supabase.from('trips').update({
            current_lat: position.coords.latitude,
            current_lng: position.coords.longitude,
            updated_at: new Date().toISOString(),
          }).eq('id', tripId);
        },
        (error) => console.error("Erro no GPS:", error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      alert("Seu navegador não suporta geolocalização.");
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    // Atualiza o status para Concluído (RF13)
    await supabase.from('trips').update({ status: 'completed' }).eq('id', tripId);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 text-center space-y-6">
        <div className="bg-emerald-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-emerald-600 mb-4">
          <BusFront size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800">Painel do Motorista</h1>
        <p className="text-gray-500 text-sm">Controle de Rota e Compartilhamento de GPS</p>

        {isTracking ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="animate-pulse" />
            <span className="font-semibold">Transmitindo localização...</span>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-gray-500">
            <MapPin />
            <span>GPS pausado.</span>
          </div>
        )}

        <button 
          onClick={isTracking ? stopTracking : startTracking}
          className={`w-full py-4 rounded-lg font-bold text-white transition-colors text-lg ${
            isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {isTracking ? 'Encerrar Rota' : 'Iniciar Rota'}
        </button>
      </div>
    </main>
  );
}