export interface Document {
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
  status: "Draft" | "Review" | "Published";
  visibility: "Private" | "Workspace";
  cover_image: string;
  template: string;
  archived: boolean;
  word_count: number;
  reading_time: number;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentInput {
  project: number;
  title: string;
  content?: string;
  status?: "Draft" | "Review" | "Published";
  visibility?: "Private" | "Workspace";
  cover_image?: string;
  template?: string;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: string;
  status?: "Draft" | "Review" | "Published";
  visibility?: "Private" | "Workspace";
  cover_image?: string;
  template?: string;
  archived?: boolean;
}

export interface DocumentsFilterParams {
  project?: string;
  status?: string;
  visibility?: string;
  search?: string;
  ordering?: string;
  archived?: string;
}
