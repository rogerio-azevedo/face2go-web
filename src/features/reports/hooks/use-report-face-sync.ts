'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useRegistrationFaceSync } from '@/features/registrations/hooks/use-registration-face-sync';
import type {
  EnrollmentGroup,
  EnrollmentListItem,
  EnrollmentReportScope,
} from '@/features/reports/types';
import { useFaceSyncOffer } from '@/lib/use-face-sync-offer';

const SCHOOL_KIND = {
  students: 'student',
  responsibles: 'responsible',
  members: 'member',
} as const;

export type ReportSyncOptions = { force?: boolean; allowSimilarFace?: boolean };

export function useReportFaceSync(params: {
  scope: EnrollmentReportScope;
  clientId?: string;
  group: EnrollmentGroup;
}) {
  const { scope, clientId, group } = params;
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['enrollment-report-list'] });
    void queryClient.invalidateQueries({
      queryKey: ['enrollment-report-summary'],
    });
  }, [queryClient]);

  const isRegistration = group === 'registrations';
  const registrationSync = useRegistrationFaceSync({
    variant: scope,
    companyClientId: clientId,
    onAfterSync: refresh,
  });
  const schoolSync = useFaceSyncOffer({
    clientId: clientId ?? '',
    kind: isRegistration ? 'member' : SCHOOL_KIND[group],
    onAfterSync: refresh,
  });

  const canSync = isRegistration || (scope === 'company' && Boolean(clientId));

  async function sync(row: EnrollmentListItem, options?: ReportSyncOptions) {
    if (!canSync) return;
    setSyncingId(row.id);
    try {
      if (isRegistration) {
        await registrationSync.runSync(row.id, row.name, options);
      } else {
        await schoolSync.runSync(row.id, row.name, {
          allowSimilarFace: options?.allowSimilarFace,
        });
      }
    } finally {
      setSyncingId(null);
    }
  }

  return {
    canSync,
    canForce: isRegistration,
    syncingId,
    sync,
  };
}
