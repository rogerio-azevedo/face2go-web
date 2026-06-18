import { Mail, MapPinHouse, Phone, Star, X } from 'lucide-react'
import Link from 'next/link'

import type {
  FilterSuppliersByCategoriesQuery,
  GetCondosByPersonQuery,
} from '@/graphql/generated'

import { LinkSupplierModal } from './link-supplier-modal'

interface SupplierLayoutProps {
  data: FilterSuppliersByCategoriesQuery['filterSuppliersByCategories'][number] & {
    address?: { latitude: number; longitude: number }
  }
  condos: GetCondosByPersonQuery['getCondosByPerson']
  onClose: () => void
}

export function SupplierLayout({ data, condos, onClose }: SupplierLayoutProps) {
  const averageRating: number =
    Array.isArray(data?.supplierRatings) && data.supplierRatings.length > 0
      ? data.supplierRatings.reduce((sum, t) => sum + (t.rating ?? 0), 0) /
        data.supplierRatings.length
      : 0

  const roundedRating = Math.round(averageRating)

  return (
    <div className="max-w-xs p-2">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPinHouse className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-800">Fornecedor</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar popup"
          className="rounded p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="truncate text-xl font-medium text-gray-900">
          {data.name || 'Nome do fornecedor'}
        </h3>

        {data.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="break-all">{data.phone}</span>
          </div>
        )}

        {typeof roundedRating === 'number' && (
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <span className="font-medium">Avaliação:</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < roundedRating ? 'text-yellow-500' : 'text-gray-300'}`}
                  fill="currentColor"
                />
              ))}
            </div>
            {data.supplierRatings?.length != null && (
              <span className="ml-2 text-gray-500">
                ({data.supplierRatings.length})
              </span>
            )}
          </div>
        )}

        {data.contact_email && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="break-all">{data.contact_email}</span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href={`/supplier-info/${data.id}`}
          target="_blank"
          className="block w-full rounded-md bg-pro-light px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-pro-dark"
        >
          Ver detalhes
        </Link>

        <LinkSupplierModal
          condos={condos.map((condo) => ({
            label: condo.name,
            value: condo.id,
          }))}
          data={data}
        />
      </div>
    </div>
  )
}
