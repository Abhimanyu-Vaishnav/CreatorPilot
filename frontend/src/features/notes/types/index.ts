export interface Note {
  id: number;
  project: number;
  project_slug: string;
  project_title: string;
  owner: number;
  owner_email: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  word_count: number;
  reading_time: number;
  color: string;
  template: string;
  status: "Draft" | "Published";
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  project: number; // project ID
  title: string;
  content?: string;
  favorite?: boolean;
  pinned?: boolean;
  color?: string;
  template?: string;
  status?: "Draft" | "Published";
}

export interface UpdateNoteInput extends Partial<CreateNoteInput> {
  archived?: boolean;
  excerpt?: string;
  status?: "Draft" | "Published";
}

export interface NotesFilterParams {
  project?: string; // slug or ID
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  status?: string;
  search?: string;
  ordering?: string;
}
