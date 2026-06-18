'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import './map-styles.css'

import clsx from 'clsx'
import { Building, MapPinHouse } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Map, { Marker, Popup, ViewState } from 'react-map-gl/mapbox'

import { env } from '@/env'
import type {
  FilterSuppliersByCategoriesQuery,
  GetAllSupplierCategoriesQuery,
  GetAllSupplierSubCategoriesQuery,
  GetCondosByPersonQuery,
} from '@/graphql/generated'
import { filterSuppliersByCategories } from '@/http/filter-suppliers-by-categories'

import { FilterPanel } from './filter-panel'
import { renderPopupLayout } from './popup-layout'

interface Location {
  latitude: number
  longitude: number
}

interface MapComponentProps {
  condos: GetCondosByPersonQuery['getCondosByPerson']
  suppliers: FilterSuppliersByCategoriesQuery['filterSuppliersByCategories']
  supplierCategories: NonNullable<
    GetAllSupplierCategoriesQuery['getAllSupplierCategories']
  >
  supplierSubCategories: NonNullable<
    GetAllSupplierSubCategoriesQuery['getAllSupplierSubCategories']
  >
  initialFilters?: {
    categoryIds: string[]
    subcategoryIds: string[]
    location: string
    stars: number
  }
}

interface PopupInfo {
  type: 'condo' | 'supplier'
  data: any
  latitude: number
  longitude: number
}

export function MapComponent({
  condos,
  suppliers,
  supplierCategories,
  supplierSubCategories,
  initialFilters,
}: MapComponentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const condoWithAddress = condos.find(
    (condo) => condo?.address !== null && condo?.address !== undefined,
  )

  const [viewState, setViewState] = useState<ViewState>({
    latitude:
      condoWithAddress && condoWithAddress?.address
        ? condoWithAddress?.address?.latitude
        : -21.244748459370157,
    longitude:
      condoWithAddress && condoWithAddress?.address
        ? condoWithAddress?.address?.longitude
        : -56.35903534466149,
    zoom: condoWithAddress && condoWithAddress?.address ? 12 : 4,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  })

  const [userLocation, setUserLocation] = useState<Location | null>(null)
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null)
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers)
  const [isLoading, setIsLoading] = useState(false)

  // Filter state - inicializar com os filtros do servidor
  const [filters, setFilters] = useState({
    categoryIds: initialFilters?.categoryIds || [],
    subcategoryIds: initialFilters?.subcategoryIds || [],
    location: initialFilters?.location || '',
    stars: initialFilters?.stars || 0,
  })

  // Carregar filtros dos search params apenas se não tivermos initialFilters
  useEffect(() => {
    if (!initialFilters && searchParams) {
      const categoryIds =
        searchParams.get('categoryIds')?.split(',').filter(Boolean) || []
      const subcategoryIds =
        searchParams.get('subcategoryIds')?.split(',').filter(Boolean) || []
      const location = searchParams.get('location') || ''
      const stars = parseInt(searchParams.get('stars') || '0')

      setFilters({
        categoryIds,
        subcategoryIds,
        location,
        stars,
      })

      // Se há filtros nos search params, aplicar automaticamente
      if (categoryIds.length > 0 || subcategoryIds.length > 0) {
        handleFilterPoints({
          categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
          subcategoryIds:
            subcategoryIds.length > 0 ? subcategoryIds : undefined,
        })
      }
    }
  }, [searchParams, initialFilters])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setUserLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
        },
      )
    }
  }, [])

  function handleMarkerClick(
    type: 'condo' | 'supplier',
    data: any,
    latitude: number,
    longitude: number,
  ) {
    setPopupInfo({
      type,
      data,
      latitude,
      longitude,
    })
  }

  function handleClosePopup() {
    setPopupInfo(null)
  }

  function handleFilterChange(newFilters: typeof filters) {
    setFilters(newFilters)

    // Salvar filtros nos search params
    const params = new URLSearchParams()
    if (newFilters.categoryIds.length > 0) {
      params.set('categoryIds', newFilters.categoryIds.join(','))
    }
    if (newFilters.subcategoryIds.length > 0) {
      params.set('subcategoryIds', newFilters.subcategoryIds.join(','))
    }
    if (newFilters.location) {
      params.set('location', newFilters.location)
    }
    if (newFilters.stars > 0) {
      params.set('stars', newFilters.stars.toString())
    }

    router.push(`/maps?${params.toString()}`)
  }

  async function handleFilterPoints(filterParams?: {
    categoryIds?: string[]
    subcategoryIds?: string[]
  }) {
    setIsLoading(true)
    try {
      const { filterSuppliersByCategories: newSuppliers } =
        await filterSuppliersByCategories({
          categoryIds:
            filterParams?.categoryIds ||
            (filters.categoryIds.length > 0 ? filters.categoryIds : undefined),
          subcategoryIds:
            filterParams?.subcategoryIds ||
            (filters.subcategoryIds.length > 0
              ? filters.subcategoryIds
              : undefined),
        })
      setFilteredSuppliers(newSuppliers)
    } catch (error) {
      console.error('Erro ao filtrar fornecedores:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if(userLocation) {
      setViewState({
        ...viewState,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude
      })
    }
  }, [userLocation])

  return (
    <div className="relative h-full w-full">
      <Map
        mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
      >
        {condos.map((condo) => {
          if (
            condo?.address &&
            condo?.address?.latitude &&
            condo?.address?.longitude
          ) {
            return (
              <Marker
                key={condo.id}
                longitude={condo?.address?.longitude}
                latitude={condo?.address?.latitude}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  if (condo.address) {
                    handleMarkerClick(
                      'condo',
                      condo,
                      condo.address.latitude,
                      condo.address.longitude,
                    )
                  }
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-8 w-8 animate-ping rounded-full bg-green-400 opacity-50" />
                  <Building
                    className={clsx(
                      "size-10 cursor-pointer rounded-full p-2 bg-green-400 text-white shadow hover:scale-110 hover:bg-green-500",
                      popupInfo?.type === "condo" && popupInfo?.data?.id === condo.id
                        ? "text-white scale-110 bg-green-500"
                        : ""
                    )}
                  />
                </div>
              </Marker>
            )
          }
        })}

        {filteredSuppliers?.map((supplier) =>
          supplier?.addresses?.map((address, index) => {
            if (address?.latitude && address?.longitude) {
              return (
                <Marker
                  key={`${supplier.id}-${address.longitude}-${address.latitude}-${index}`}
                  longitude={address.longitude}
                  latitude={address.latitude}
                  anchor="bottom"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    handleMarkerClick(
                      'supplier',
                      { ...supplier, address },
                      address.latitude,
                      address.longitude,
                    )
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-8 w-8 animate-ping rounded-full bg-red-400 opacity-50" />
                    <MapPinHouse
                      className={clsx(
                        "size-8 cursor-pointer rounded-full p-1 bg-red-400  text-white shadow hover:scale-110 hover:bg-red-500",
                        popupInfo?.type === "supplier" && popupInfo?.data?.id === supplier.id
                          ? "text-red-500 scale-110 bg-red-500"
                          : ""
                      )}
                    />
                  </div>
                </Marker>
              )
            }
          }),
        )}

        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="bottom"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute h-8 w-8 animate-ping rounded-full bg-green-400 opacity-50" />
              <div className="relative h-5 w-5 rounded-full border-2 border-white bg-green-600 shadow-lg" />
            </div>
          </Marker>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            offset={[0, -25]}
            onClose={handleClosePopup}
            closeButton={false}
            closeOnClick={false}
            className="z-50 min-w-[320px]"
            
          >
            {renderPopupLayout({
              type: popupInfo.type,
              data: popupInfo.data,
              onClose: handleClosePopup,
              condos: condos,
            })}
          </Popup>
        )}
      </Map>

      {/* Draggable Filter Component */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFilterChange}
        onFilterPoints={handleFilterPoints}
        supplierCategories={supplierCategories}
        supplierSubCategories={supplierSubCategories}
        isLoading={isLoading}
      />
    </div>
  )
}
