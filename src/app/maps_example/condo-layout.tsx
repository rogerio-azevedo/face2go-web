import { Building, ChartPie, Home, Loader2, Phone, X } from 'lucide-react'

import {
  type GetCondosByPersonQuery,
  useListCampaignsByCondoIdQuery,
} from '@/graphql/generated'
import { calculateNpsAverage } from '@/utils/calculate-nps-average'

interface CondoLayoutProps {
  data: GetCondosByPersonQuery['getCondosByPerson'][number]
  onClose: () => void
}

export function CondoLayout({ data, onClose }: CondoLayoutProps) {
  const { data: npsData, loading } = useListCampaignsByCondoIdQuery({
    variables: { condo_id: data.id },
  })

  const npsStats = calculateNpsAverage(npsData)

  return (
    <div className="w-full rounded-xl bg-transparent p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="size-5 text-green-700" />
          <h3 className="font-semibold text-gray-800">Condomínio</h3>
        </div>

        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{data.name}</h4>
        </div>

        {data.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="size-4" />
            <span>{data.phone}</span>
          </div>
        )}

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <ChartPie className="mt-0.5 size-4" />

          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : npsStats ? (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-800">
                NPS: {npsStats.npsScore}
              </span>
              <span className="text-xs text-gray-500">
                Média: {npsStats.average}/10 ({npsStats.totalResponses}{' '}
                respostas)
              </span>
            </div>
          ) : (
            <span className="text-gray-500">Nenhuma campanha NPS</span>
          )}
        </div>
          
        {data.blocks && data.blocks.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building className="size-4" />
            <span>{data.blocks.length} bloco(s)</span>
          </div>
        )}

        {data.unities && data.unities.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Home className="size-4" />
            <span>{data.unities.length} unidade(s)</span>
          </div>
        )}
      </div>
    </div>
  )
}
