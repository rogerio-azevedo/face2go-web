import { DialogTrigger } from "@radix-ui/react-dialog";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EntityModal } from "@/components/entity-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from "@/components/ui/label";
import {
  FilterSuppliersByCategoriesQuery,
  useCreateCondoSupplierMutation,
  useGetCondoSuppliersByCondoQuery,
} from '@/graphql/generated'
import { customRevalidateTag } from "@/utils/next/revalidate-tag";

interface LinkSupplierModalProps {
  data: FilterSuppliersByCategoriesQuery['filterSuppliersByCategories'][number] & {
    address?: { latitude: number; longitude: number }
  }
  condos: {label: string, value: string}[]
}

export function LinkSupplierModal({data, condos}: LinkSupplierModalProps) {
  const [openLinkModal, setOpenLinkModal] = useState(false)
  const [selectedCondo, setSelectedCondo] = useState('')

  const [createCondoSupplier, { loading: linkSupplierLoading }] =
    useCreateCondoSupplierMutation()

  // Busca fornecedores já vinculados ao condomínio selecionado
  const { data: condoSuppliersData } = useGetCondoSuppliersByCondoQuery({
    variables: { condo_id: selectedCondo },
    skip: !selectedCondo,
  })

  async function handleLinkSupplier() {
    if (!data.id || !selectedCondo) return

    // Verifica se o fornecedor já está vinculado ao condomínio selecionado
    const alreadyLinked = condoSuppliersData?.getCondoSuppliersByCondo?.some(
      (condoSupplier) => condoSupplier.supplier_id === data.id,
    )

    if (alreadyLinked) {
      toast.error('Esse fornecedor já está vinculado a esse condomínio')
      return
    }

    try {
      await createCondoSupplier({
        variables: {
          supplier_id: data.id,
          condo_id: selectedCondo,
        },
      })
      await customRevalidateTag(`link-suppliers`)

      setSelectedCondo('')
      toast.success('Fornecedor vinculado com sucesso!')
      setOpenLinkModal(false)
    } catch (error: any) {
      // Se o erro vier do backend (ConflictException), mostra a mensagem
      if (error?.message?.includes('já está vinculado')) {
        toast.error('Esse fornecedor já está vinculado a esse condomínio')
      } else {
        toast.error('Erro ao vincular fornecedor. Tente novamente.')
      }
    }
  }


  return(
    <Dialog open={openLinkModal} onOpenChange={setOpenLinkModal}>
      <DialogTrigger
        className="mt-2 inline-block w-full rounded-md bg-pro-light px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-pro-dark"
      >
        Vincular ao condomínio
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl p-6 bg-white shadow-lg border border-gray-100">
        <DialogHeader className="pb-2 border-b border-gray-200">
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Vincular fornecedor
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Escolha o condomínio e confirme para vincular este fornecedor.
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="condo" className="text-sm font-medium text-gray-700">
              Condomínio
            </Label>
            <EntityModal
              placeholder="Selecione o condomínio"
              data={condos.map((condo) => ({ label: condo.label, value: condo.value }))}
              onSelect={setSelectedCondo}
            />
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{data.name}</h2>
            {data.phone && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Phone className="w-4 h-4" />
                <span>{data.phone}</span>
              </div>
            )}
            {data.contact_email && (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Mail className="w-4 h-4" />
                <span>{data.contact_email}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" className="text-gray-700 hover:bg-gray-100">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleLinkSupplier}
            disabled={selectedCondo.trim() === ''}
            isLoading={linkSupplierLoading}
            className="bg-pro-light text-white hover:bg-pro-dark"
          >
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}