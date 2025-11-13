import { SectionType } from './types';

// Mapping sections to paragraph ranges for filtering logic
export const SECTION_RANGES: Record<SectionType, [number, number]> = {
  [SectionType.ALL]: [0, 9999],
  [SectionType.CREED]: [1, 1065],
  [SectionType.SACRAMENTS]: [1066, 1690],
  [SectionType.LIFE]: [1691, 2557],
  [SectionType.PRAYER]: [2558, 2865],
};