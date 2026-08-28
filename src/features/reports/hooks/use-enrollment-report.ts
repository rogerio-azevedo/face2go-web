'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getEnrollmentListAction,
  getEnrollmentSummaryAction,
} from '@/features/reports/actions/reports';
import type {
  EnrollmentGroup,
  EnrollmentReportScope,
} from '@/features/reports/types';

export type EnrollmentReportQueryInput = {
  scope: EnrollmentReportScope;
  clientId?: string;
  group: EnrollmentGroup;
  classId?: string;
  search?: string;
  hasFace?: boolean;
  hasVehicle?: boolean;
  page: number;
  pageSize?: number;
};

export function useEnrollmentSummary(input: EnrollmentReportQueryInput) {
  const enabled =
    input.scope === 'client' || Boolean(input.clientId);

  return useQuery({
    queryKey: [
      'enrollment-report-summary',
      input.scope,
      input.clientId,
      input.group,
      input.classId,
      input.search,
    ],
    queryFn: async () => {
      const result = await getEnrollmentSummaryAction(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
  });
}

export function useEnrollmentList(input: EnrollmentReportQueryInput) {
  const enabled =
    input.scope === 'client' || Boolean(input.clientId);

  return useQuery({
    queryKey: [
      'enrollment-report-list',
      input.scope,
      input.clientId,
      input.group,
      input.classId,
      input.search,
      input.hasFace,
      input.hasVehicle,
      input.page,
      input.pageSize,
    ],
    queryFn: async () => {
      const result = await getEnrollmentListAction(input);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
  });
}
