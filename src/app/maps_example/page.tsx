import { auth } from '@/auth'
import { fetchAllSupplierCategories } from '@/http/fetch-all-supplier-categories'
import { fetchAllSupplierSubCategories } from '@/http/fetch-all-supplier-sub-categories'
import { fetchCondosByPerson } from '@/http/fetch-condos-by-person'
import { filterSuppliersByCategories } from '@/http/filter-suppliers-by-categories'

import { MapLazy } from './map-lazy'

interface MapsProps {
  searchParams: Promise<{
    categoryIds?: string
    subcategoryIds?: string
  }>
}

export default async function Maps({ searchParams }: MapsProps) {
  const { user } = await auth()
  const params = await searchParams

  // Processar os filtros dos search params
  const categoryIds = params.categoryIds?.split(',').filter(Boolean)
  const subcategoryIds = params.subcategoryIds?.split(',').filter(Boolean)

  const [
    { condos },
    { supplierCategories },
    { supplierSubCategories },
    { filterSuppliersByCategories: suppliers },
  ] = await Promise.all([
    fetchCondosByPerson({
      person_id: user.isEmployee ? user.createdByPersonId! : user.id,
    }),
    fetchAllSupplierCategories(),
    fetchAllSupplierSubCategories(),
    filterSuppliersByCategories({
      categoryIds: categoryIds?.length ? categoryIds : undefined,
      subcategoryIds: subcategoryIds?.length ? subcategoryIds : undefined,
    }),
  ])

  // const suppliersAddresses =
  // suppliers
  //   ?.flatMap((supplier) => supplier?.addresses || [])
  //   .filter(
  //     (address): address is NonNullable<typeof address> => address != null,
  //   ) || []

  return (
    <main className="h-full w-full rounded-lg p-3">
      <MapLazy
        condos={condos}
        suppliers={suppliers}
        supplierCategories={supplierCategories}
        supplierSubCategories={supplierSubCategories}
        initialFilters={{
          categoryIds: categoryIds || [],
          subcategoryIds: subcategoryIds || [],
          location: '',
          stars: 3,
        }}
      />
    </main>
  )
}
