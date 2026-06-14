'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center text-gray-500">
      Carregando mapa...
    </div>
  ),
});

export default function Map() {
  return <DynamicMap />;
}