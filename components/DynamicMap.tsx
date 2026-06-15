'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useState } from 'react';
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

export default function DynamicMap() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*, routes(name)')
        .in('status', ['in_transit', 'delayed']);

      if (error) {
        console.error('Erro ao buscar viagens:', error.message);
        return;
      }

      setTrips((data ?? []) as Trip[]);
    };

    fetchTrips();

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
  }, [supabase]);

  return (
    <div className="h-full w-full relative z-0">
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
