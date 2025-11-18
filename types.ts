
export interface CatechismParagraph {
  id: number;
  text: string;
  section?: string; // e.g., "Profissão de Fé"
  source?: 'local' | 'ai';
  bibleReferences?: string[]; // Bible verses (Catholic Canon)
}

export enum SectionType {
  ALL = 'Todos',
  CREED = 'Profissão de Fé',
  SACRAMENTS = 'Sacramentos',
  LIFE = 'A Vida em Cristo',
  PRAYER = 'Oração Cristã',
}

export interface SearchFilters {
  query: string;
  section: SectionType;
}
