import type { components } from '@/types/api.generated';
export type ChildApprovalPreview =
    components['schemas']['ChildApprovalPreviewDto'];
export type ChildApprovalHistory =
    components['schemas']['ChildApprovalHistoryDto'];
export type ChildApprovalSummary = ChildApprovalHistory['summary'];
export type ChildApprovalResult =
    components['schemas']['ChildApprovalResultDto'];
export type ChildApprovalTarget = {
    variant: 'client' | 'company';
    registrationId: string;
    companyClientId?: string;
};
