'use client';

import {
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AllowSimilarFaceDialog } from '@/features/faces/components/AllowSimilarFaceDialog';
import type { ReportSyncOptions } from '@/features/reports/hooks/use-report-face-sync';
import type { EnrollmentListItem } from '@/features/reports/types';
import { isPartialSyncError } from '@/lib/face-sync-result';
import { isSimilarFaceSyncError } from '@/lib/similar-face-error';

type ReportRowActionsProps = {
  row: EnrollmentListItem;
  href: string | null;
  isAdmin: boolean;
  canSync: boolean;
  canForce: boolean;
  syncing: boolean;
  onSync: (row: EnrollmentListItem, options?: ReportSyncOptions) => void;
};

export function ReportRowActions({
  row,
  href,
  isAdmin,
  canSync,
  canForce,
  syncing,
  onSync,
}: ReportRowActionsProps) {
  const [confirm, setConfirm] = useState<'force' | 'similar' | null>(null);

  const syncable = canSync && row.hasFace && row.hasFacialReaders;
  const needsSync =
    row.deviceSyncStatus !== 'synced' ||
    isPartialSyncError(row.deviceSyncError);
  const showForce = syncable && canForce;
  const showSimilar =
    syncable && isAdmin && isSimilarFaceSyncError(row.deviceSyncError);

  return (
    <div className="flex items-center justify-end gap-1">
      {syncable && needsSync ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={syncing}
          onClick={() => onSync(row)}
        >
          {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Sincronizar
        </Button>
      ) : null}

      {showForce || showSimilar ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Mais ações"
                disabled={syncing}
              >
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-auto min-w-40">
            {showForce ? (
              <DropdownMenuItem onClick={() => setConfirm('force')}>
                <RotateCcw />
                Forçar sincronização
              </DropdownMenuItem>
            ) : null}
            {showSimilar ? (
              <DropdownMenuItem onClick={() => setConfirm('similar')}>
                <ShieldAlert />
                Permitir face parecida
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {href ? (
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          aria-label="Abrir cadastro em nova aba"
          title="Abrir cadastro em nova aba"
          render={<a href={href} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink />
        </Button>
      ) : null}

      <AlertDialog
        open={confirm === 'force'}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Forçar sincronização?</AlertDialogTitle>
            <AlertDialogDescription>
              Reenvia {row.name} a todos os leitores, inclusive os já
              sincronizados. Use se a foto sumiu no equipamento ou o status
              ficou inconsistente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                setConfirm(null);
                onSync(row, { force: true });
              }}
            >
              Forçar sync
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AllowSimilarFaceDialog
        open={confirm === 'similar'}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        personName={row.name}
        error={row.deviceSyncError}
        busy={syncing}
        onConfirm={() => {
          setConfirm(null);
          onSync(row, { allowSimilarFace: true });
        }}
      />
    </div>
  );
}
