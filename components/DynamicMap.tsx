'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createClient } from '@/utils/supabase/client';
// @ts-expect-error: side-effect import of CSS file without type declarations
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function DynamicMap() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trips, setTrips] = useState<any[]>([]);
  // Coordenadas centrais aproximadas da cidade
  const position: [number, number] = [-4.97813, -39.0188];
  const supabase = createClient();

  useEffect(() => {
    // 1. Busca inicial das posições dos ônibus ativos
    const fetchTrips = async () => {
      const { data } = await supabase
        .from('trips')
        .select('*, routes(name)')
        .in('status', ['in_transit', 'delayed']);

      if (data) setTrips(data);
    };

    fetchTrips();

    // 2. Escuta silenciosamente por alterações no banco de dados (Tempo Real)
    const channel = supabase
      .channel('realtime_trips')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload) => {
        setTrips((currentTrips) =>
          currentTrips.map((trip) =>
            // Se o ID do ônibus atualizado for igual ao que temos no mapa, atualiza as coordenadas
            trip.id === payload.new.id ? { ...trip, ...payload.new } : trip
          )
        );
      })
      .subscribe();

    // Limpa a conexão se o componente for fechado
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="h-full w-full relative z-0">
        <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="h-full w-full rounded-lg shadow-md border border-gray-200" style={{ zIndex: 10 }}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Renderiza um marcador dinâmico para cada ônibus encontrado no Supabase */}
        {trips.map((trip) => (
          trip.current_lat && trip.current_lng && (
            <Marker key={trip.id} position={[trip.current_lat, trip.current_lng]} icon={icon}>
              <Popup>
                <b>{trip.routes?.name || 'Rota Universitária'}</b><br />
                Status: {trip.status === 'delayed' ? 'Atrasado' : 'Em trânsito'}<br />
                Próxima Parada: {trip.eta_next_stop || 'Calculando...'}
              </Popup>
            </Marker>
          )
        ))}
        </MapContainer>
    </div>
  );
}