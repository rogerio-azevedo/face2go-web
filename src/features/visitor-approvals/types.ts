import type { components } from '@/types/api.generated';
export type VisitorApprovalPreview =
    components['schemas']['VisitorApprovalPreviewDto'];
export type VisitorApprovalHistory =
    components['schemas']['VisitorApprovalHistoryDto'];
export type VisitorApprovalSummary = VisitorApprovalHistory['summary'];
export type VisitorApprovalResult =
    components['schemas']['VisitorApprovalResultDto'];
export type VisitorApprovalTarget = {
    variant: 'client' | 'company';
    registrationId: string;
    companyClientId?: string;
};
