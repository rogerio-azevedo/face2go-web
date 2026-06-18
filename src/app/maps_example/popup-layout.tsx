import type {
  FilterSuppliersByCategoriesQuery,
  GetCondosByPersonQuery,
} from '@/graphql/generated'

import { CondoLayout } from './condo-layout'
import { SupplierLayout } from './supplier-layout'

interface PopupLayoutProps {
  type: 'condo' | 'supplier'
  data:
    | GetCondosByPersonQuery['getCondosByPerson'][number]
    | (FilterSuppliersByCategoriesQuery['filterSuppliersByCategories'][number] & {
        address?: { latitude: number; longitude: number }
      })
  onClose: () => void
  condos: GetCondosByPersonQuery['getCondosByPerson']
}

export function renderPopupLayout({ type, data, onClose, condos }: PopupLayoutProps) {
  if (type === 'condo') {
    return (
      <CondoLayout
        data={data as GetCondosByPersonQuery['getCondosByPerson'][number]}
        onClose={onClose}
      />
    )
  }

  if (type === 'supplier') {
    return (
      <SupplierLayout
        data={
          data as FilterSuppliersByCategoriesQuery['filterSuppliersByCategories'][number] & {
            address?: { latitude: number; longitude: number }
          }
        }
        onClose={onClose}
        condos={condos}
      />
    )
  }

  return null
}
