'use client'

import dynamic from 'next/dynamic'

export const MapLazy = dynamic(
  () => import('./map').then((m) => m.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
    ),
  },
)
