'use client'

import { clsx } from 'clsx'
import { Loader2, Maximize2, Minimize2, Move, X, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type {
  GetAllSupplierCategoriesQuery,
  GetAllSupplierSubCategoriesQuery,
} from '@/graphql/generated'

interface FilterPosition {
  x: number
  y: number
}

interface Filters {
  categoryIds: string[]
  subcategoryIds: string[]
  location: string
  stars: number
}

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onFilterPoints: () => void
  onClose?: () => void
  supplierCategories: GetAllSupplierCategoriesQuery['getAllSupplierCategories']
  supplierSubCategories: GetAllSupplierSubCategoriesQuery['getAllSupplierSubCategories']
  isLoading?: boolean
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onFilterPoints,
  onClose,
  supplierCategories,
  supplierSubCategories,
  isLoading,
}: FilterPanelProps) {
  const [filterPosition, setFilterPosition] = useState<FilterPosition>({
    x: 20,
    y: 20,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const filterRef = useRef<HTMLDivElement>(null)

  // Drag and drop handlers
  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()

    if (filterRef.current) {
      const rect = filterRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left + 26,
        y: e.clientY - rect.top + 80,
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        // Constrain to viewport
        const maxX = window.innerWidth - (filterRef.current?.offsetWidth || 320)
        const maxY =
          window.innerHeight - (filterRef.current?.offsetHeight || 400)

        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, maxX))
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, maxY))

        // Prevent jumping by ensuring smooth movement
        setFilterPosition({
          x: newX,
          y: newY,
        })
      }
    },
    [isDragging, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  function handleFilterChange(
    field: keyof Filters,
    value: string[] | string | number,
  ) {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  function toggleMinimize() {
    setIsMinimized(!isMinimized)
  }

  // Helper function to get option label by value
  function getOptionLabel(
    value: string,
    options: Array<{ value: string; label: string }>,
  ) {
    return options.find((option) => option.value === value)?.label || value
  }

  // Helper function to remove item from selection
  function removeItem(value: string, field: 'categoryIds' | 'subcategoryIds') {
    const currentValues = filters[field]
    const newValues = currentValues.filter((item) => item !== value)
    handleFilterChange(field, newValues)
  }

  // Handle multiple selection for categories
  function handleCategorySelect(value: string) {
    if (value === 'all') return // Ignore "all" option for multiple selection

    const currentValues = filters.categoryIds
    if (currentValues.includes(value)) {
      // Remove if already selected
      const newValues = currentValues.filter((item) => item !== value)
      handleFilterChange('categoryIds', newValues)
    } else {
      // Add if not selected
      const newValues = [...currentValues, value]
      handleFilterChange('categoryIds', newValues)
    }
  }

  // Handle multiple selection for subcategories
  function handleSubcategorySelect(value: string) {
    if (value === 'all') return // Ignore "all" option for multiple selection

    const currentValues = filters.subcategoryIds
    if (currentValues.includes(value)) {
      // Remove if already selected
      const newValues = currentValues.filter((item) => item !== value)
      handleFilterChange('subcategoryIds', newValues)
    } else {
      // Add if not selected
      const newValues = [...currentValues, value]
      handleFilterChange('subcategoryIds', newValues)
    }
  }

  const hasFilters =
    filters.categoryIds.length > 0 || filters.subcategoryIds.length > 0

  return (
    <div
      ref={filterRef}
      className={clsx(
        'absolute z-10 w-full max-w-sm rounded-lg border border-gray-200 bg-white/70 shadow-md',
        isDragging && 'cursor-grabbing',
        isMinimized
          ? 'h-12 overflow-hidden'
          : 'transition-[height] duration-300',
      )}
      style={{
        left: filterPosition.x,
        top: filterPosition.y,
      }}
    >
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between rounded-t-lg bg-pro-light  px-3 text-white">
        <Button
          variant="ghost"
          size="sm"
          title="Arrastar"
          className="h-8 w-8 cursor-grab p-0"
          onMouseDown={handleMouseDown}
        >
          <Move className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
            className="h-8 w-8 p-0"
            onClick={toggleMinimize}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              title="Fechar"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {!isMinimized && (
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-4">
          {/* Categoria */}
          <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-700">Categoria</Label>

          <Combobox
            data={supplierCategories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            onSelect={handleCategorySelect}
            placeholder="Selecione uma categoria"
            emptyHeading="Nenhuma encontrada"
            showSelectedValues={false}
            triggerClassName={clsx(
              'h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm',
              'text-gray-700 shadow-sm transition focus:border-gray-500 focus:outline-none focus:ring-blue-500',
              'placeholder:text-gray-400 hover:border-gray-400'
            )}
            commandClassName={clsx(
              'w-full rounded-md border border-gray-200 bg-white p-1 shadow-md',
              'max-h-60 overflow-auto text-sm'
            )}
          />
          </div>

          {/* Subcategoria */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              Subcategoria
            </Label>
            <Combobox
              data={supplierSubCategories.map((subcategory) => ({
                value: subcategory.id,
                label: subcategory.name,
              }))}
              onSelect={handleSubcategorySelect}
              placeholder="Selecione a subcategoria"
              emptyHeading="Nenhuma encontrada"
              showSelectedValues={false}
              triggerClassName={clsx(
                'h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm',
                'text-gray-700 shadow-sm transition focus:border-gray-500 focus:outline-none',
                'placeholder:text-gray-400 hover:border-gray-400'
              )}
              commandClassName={clsx(
                'w-full rounded-md border border-gray-200 bg-white p-1 shadow-md',
                'max-h-60 overflow-auto text-sm'
              )}
            />
          </div>

          {/* Localização */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">Localização</Label>

            <Input
              placeholder="Digite cidade, bairro ou CEP"
              className={clsx(
                'h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700',
                'placeholder:text-gray-400 shadow-sm transition focus:border-gray-500 focus:outline-none',
                'hover:border-gray-400'
              )}
            />
          </div>

          {/* Filtros ativos */}
          {hasFilters && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              {/* Categorias selecionadas */}
              {filters.categoryIds.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    Categorias selecionadas
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.categoryIds.map((value) => (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        {getOptionLabel(
                          value,
                          supplierCategories.map((cat) => ({
                            value: cat.id,
                            label: cat.name,
                          })),
                        )}
                        <XCircle
                          className="size-4 cursor-pointer hover:text-blue-600"
                          onClick={() => removeItem(value, 'categoryIds')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategorias selecionadas */}
              {filters.subcategoryIds.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    Subcategorias selecionadas
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filters.subcategoryIds.map((value) => (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        {getOptionLabel(
                          value,
                          supplierSubCategories.map((sub) => ({
                            value: sub.id,
                            label: sub.name,
                          })),
                        )}
                        <XCircle
                          className="size-4 cursor-pointer hover:text-green-600"
                          onClick={() => removeItem(value, 'subcategoryIds')}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Estrelas */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Estrelas: {filters.stars}
            </Label>
            <Slider
              defaultValue={[filters.stars || 3]}
              max={5}
              step={1}
              min={1}
              className="slider-custom"
              onValueChange={(value) => handleFilterChange('stars', value[0])}
            />
          </div>

          {/* Botão */}
          <Button
            onClick={onFilterPoints}
            disabled={isLoading}
            className="w-full bg-pro-dark text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Filtrando...
              </>
            ) : (
              'Filtrar'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
