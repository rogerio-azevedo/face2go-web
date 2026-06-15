'use client';

import { useQuery } from '@tanstack/react-query';

import { listStudentsAction } from '@/features/school/actions/students';
import type { SchoolListParams } from '@/lib/pagination';

export function useSchoolStudents(clientId: string, params: SchoolListParams = {}) {
  return useQuery({
    queryKey: ['school-students', clientId, params],
    queryFn: async () => {
      const result = await listStudentsAction(clientId, params);
      if ('error' in result) {
        throw new Error(result.error);
      }
      return result.result;
    },
    enabled: Boolean(clientId),
  });
}
