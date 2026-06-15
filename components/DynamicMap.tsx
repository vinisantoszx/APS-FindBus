'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { createClient } from '@/utils/supabase/client';

type Trip = {
  id: number;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  eta_next_stop?: string | null;
  routes?: {
    name: string;
  } | null;
};

const position: [number, number] = [-4.97813, -39.0188];

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function isTrip(value: unknown): value is Trip {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'number'
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erro desconhecido.';
}

export default function DynamicMap() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const startRealtime = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('trips')
          .select('*, routes(name)')
          .in('status', ['in_transit', 'delayed']);

        if (!mounted) return undefined;

        if (error) {
          setErro(`Erro ao buscar viagens: ${error.message}`);
          return undefined;
        }

        setTrips((data ?? []) as Trip[]);
        setErro(null);

        const channel = supabase
          .channel('realtime_trips')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload) => {
            if (!isTrip(payload.new)) return;

            setTrips((currentTrips) =>
              currentTrips.map((trip) =>
                trip.id === payload.new.id ? { ...trip, ...payload.new } : trip,
              ),
            );
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        if (mounted) {
          setErro(`Mapa sem conexão com o Supabase: ${getErrorMessage(error)}`);
        }

        return undefined;
      }
    };

    let cleanup: (() => void) | undefined;

    startRealtime().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  return (
    <div className="h-full w-full relative z-0">
      {erro && (
        <div className="absolute left-3 right-3 top-3 z-[500] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
          {erro}
        </div>
      )}

      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full rounded-lg shadow-md border border-gray-200"
        style={{ zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trips.map((trip) =>
          trip.current_lat !== null && trip.current_lng !== null ? (
            <Marker key={trip.id} position={[trip.current_lat, trip.current_lng]} icon={icon}>
              <Popup>
                <b>{trip.routes?.name || 'Rota Universitária'}</b>
                <br />
                Status: {trip.status === 'delayed' ? 'Atrasado' : 'Em trânsito'}
                <br />
                Próxima Parada: {trip.eta_next_stop || 'Calculando...'}
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
}
