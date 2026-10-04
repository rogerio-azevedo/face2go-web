export const SCHOOL_PEOPLE_SECTIONS = ['students', 'parents', 'members'] as const;

export type SchoolSection = (typeof SCHOOL_PEOPLE_SECTIONS)[number];

export function parseSchoolSection(
  value: string | undefined,
): SchoolSection | undefined {
  return SCHOOL_PEOPLE_SECTIONS.find((section) => section === value);
}
