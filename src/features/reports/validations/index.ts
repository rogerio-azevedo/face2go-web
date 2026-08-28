import { z } from 'zod';

export const enrollmentGroupSchema = z.enum([
  'students',
  'responsibles',
  'members',
]);

export type EnrollmentGroup = z.infer<typeof enrollmentGroupSchema>;

export const enrollmentReportFiltersSchema = z.object({
  scope: z.enum(['company', 'client']),
  clientId: z.string().uuid().optional(),
  group: enrollmentGroupSchema,
  classId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
  hasFace: z.boolean().optional(),
  hasVehicle: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export type EnrollmentReportFilters = z.infer<
  typeof enrollmentReportFiltersSchema
>;
