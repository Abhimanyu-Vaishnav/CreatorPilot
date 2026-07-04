export type KnowledgeType =
  | "Research Note"
  | "Website"
  | "PDF"
  | "Image"
  | "Video Link"
  | "Book"
  | "Tutorial"
  | "Checklist"
  | "Snippet"
  | "Document";

export interface KnowledgeItem {
  id: number;
  owner: number;
  owner_email: string;
  project: number;
  project_slug: string;
  project_title: string;
  title: string;
  description: string;
  type: KnowledgeType;
  source_url: string;
  file_path: string;
  note_reference: number | null;
  note_title: string | null;
  note_slug: string | null;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

export interface CreateKnowledgeInput {
  project: number;
  title: string;
  description?: string;
  type: KnowledgeType;
  source_url?: string;
  note_reference?: number | null;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
}

export interface UpdateKnowledgeInput {
  title?: string;
  description?: string;
  type?: KnowledgeType;
  source_url?: string;
  note_reference?: number | null;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
}

export interface KnowledgeFilterParams {
  project?: string | number;
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  type?: KnowledgeType | "";
  search?: string;
  ordering?: string;
}
