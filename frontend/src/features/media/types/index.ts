export type MediaAssetType =
  | "Image"
  | "Video"
  | "Audio"
  | "PDF"
  | "Logo"
  | "Thumbnail"
  | "Document"
  | "Other";

export interface MediaFolder {
  id: number;
  owner: number;
  project: number;
  project_slug: string;
  project_title: string;
  parent: number | null;
  parent_slug: string | null;
  parent_name: string | null;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: number;
  owner: number;
  owner_email: string;
  project: number;
  project_slug: string;
  project_title: string;
  folder: number | null;
  folder_name: string | null;
  folder_slug: string | null;
  related_document: number | null;
  related_document_title: string | null;
  related_document_slug: string | null;
  related_note: number | null;
  related_note_title: string | null;
  related_note_slug: string | null;
  related_knowledge: number | null;
  related_knowledge_title: string | null;
  related_knowledge_slug: string | null;
  related_calendar_event: number | null;
  related_calendar_event_title: string | null;
  related_task: number | null;
  related_task_title: string | null;
  title: string;
  slug: string;
  asset_type: MediaAssetType;
  description: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  thumbnail_url: string;
  storage_path: string;
  file_url: string;
  favorite: boolean;
  archived: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
}

export interface CreateMediaFolderInput {
  project: number;
  parent?: number | null;
  name: string;
}

export interface CreateMediaAssetInput {
  project: number;
  folder?: number | null;
  title?: string;
  asset_type: MediaAssetType;
  description?: string;
  related_document?: number | null;
  related_note?: number | null;
  related_knowledge?: number | null;
  related_calendar_event?: number | null;
  related_task?: number | null;
  favorite?: boolean;
  tags?: string[];
  file?: File;
}

export interface UpdateMediaAssetInput {
  project?: number;
  folder?: number | null;
  title?: string;
  asset_type?: MediaAssetType;
  description?: string;
  related_document?: number | null;
  related_note?: number | null;
  related_knowledge?: number | null;
  related_calendar_event?: number | null;
  related_task?: number | null;
  favorite?: boolean;
  archived?: boolean;
  tags?: string[];
}

export interface MediaAssetFilterParams {
  project?: string | number;
  folder?: string | number | null;
  asset_type?: MediaAssetType | "";
  favorite?: boolean;
  archived?: boolean;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}
