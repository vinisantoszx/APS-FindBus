'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function DynamicMap() {
  const position: [number, number] = [-4.97813, -39.0188];

  return (
    <div className="h-full w-full relative z-0">
        <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="h-full w-full rounded-lg shadow-md border border-gray-200" style={{ zIndex: 10 }}>
        <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[-4.97813, -39.0188]} icon={icon}>
            <Popup><b>Ônibus 01</b><br />Lotado.</Popup>
        </Marker>
        </MapContainer>
    </div>
  );
}