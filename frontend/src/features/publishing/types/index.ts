import { MediaAsset } from "../../media/types";

export interface PublishPlatform {
  id: number;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  api_capability: boolean;
  scheduling_capability: boolean;
  created_at: string;
  updated_at: string;
}

export type PublishStatus =
  | "Draft"
  | "In Review"
  | "Approved"
  | "Scheduled"
  | "Publishing"
  | "Published"
  | "Failed"
  | "Archived";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface PublishHistory {
  id: number;
  publish_item: number;
  action: string;
  performed_by: number | null;
  performed_by_name: string;
  performed_by_email: string;
  notes: string;
  created_at: string;
}

export interface PublishItem {
  id: number;
  owner: number;
  owner_username: string;
  project: number;
  project_slug: string;
  project_title: string;
  document: number | null;
  document_slug: string;
  document_title: string;
  title: string;
  slug: string;
  platform: number;
  platform_details: PublishPlatform;
  content_type: string;
  status: PublishStatus;
  excerpt: string;
  content: string;
  featured_media: number | null;
  featured_media_details: MediaAsset | null;
  additional_media: number[];
  additional_media_details: MediaAsset[];
  scheduled_at: string | null;
  published_at: string | null;
  timezone: string;
  approval_status: ApprovalStatus;
  reviewer: number | null;
  reviewer_username: string;
  notes: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  canonical_url: string | null;
  history: PublishHistory[];
  created_at: string;
  updated_at: string;
}

export interface CreatePublishItemInput {
  project: number;
  document?: number | null;
  title: string;
  platform: number;
  content_type?: string;
  status?: PublishStatus;
  excerpt?: string;
  content?: string;
  featured_media?: number | null;
  additional_media?: number[];
  scheduled_at?: string | null;
  timezone?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string | null;
}

export interface UpdatePublishItemInput {
  project?: number;
  document?: number | null;
  title?: string;
  platform?: number;
  content_type?: string;
  status?: PublishStatus;
  excerpt?: string;
  content?: string;
  featured_media?: number | null;
  additional_media?: number[];
  scheduled_at?: string | null;
  timezone?: string;
  approval_status?: ApprovalStatus;
  notes?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string | null;
}

export interface PublishingFilters {
  project?: string;
  platform?: string;
  status?: string;
  approval_status?: string;
  search?: string;
  ordering?: "newest" | "oldest" | "scheduled" | "published" | "alphabetical" | "recently_edited";
}
