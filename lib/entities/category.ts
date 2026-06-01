/**
 * CategoryEntity — mirrors the Categories table from DOCX schema.
 */
export type CategoryEntityStatus = 'Active' | 'Inactive';

export interface CategoryEntity {
  categoryId: number;
  categoryName: string; // unique key
  description: string;
  status: CategoryEntityStatus;
}
