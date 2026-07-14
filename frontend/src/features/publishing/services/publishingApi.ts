import { api } from "../../../lib/api";
import {
  PublishPlatform,
  PublishItem,
  CreatePublishItemInput,
  UpdatePublishItemInput,
  PublishingFilters
} from "../types";

export const publishingService = {
  getPlatforms: async (): Promise<PublishPlatform[]> => {
    const response = await api.get<any>("/api/publish-platforms/");
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    return Array.isArray(response) ? response : [];
  },

  getPublishItems: async (params?: PublishingFilters): Promise<{ results: PublishItem[]; count: number }> => {
    let endpoint = "/api/publishing/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.platform) queryParts.push(`platform=${encodeURIComponent(params.platform)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.approval_status) queryParts.push(`approval_status=${encodeURIComponent(params.approval_status)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }

    const response = await api.get<any>(endpoint);
    if (Array.isArray(response)) {
      return { results: response, count: response.length };
    }
    return {
      results: response.results || [],
      count: response.count || 0
    };
  },

  getPublishItem: async (slug: string): Promise<PublishItem> => {
    return api.get<PublishItem>(`/api/publishing/${slug}/`);
  },

  createPublishItem: async (data: CreatePublishItemInput): Promise<PublishItem> => {
    return api.post<PublishItem>("/api/publishing/", data);
  },

  updatePublishItem: async (slug: string, data: UpdatePublishItemInput): Promise<PublishItem> => {
    const response = await api.request(`/api/publishing/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deletePublishItem: async (slug: string): Promise<void> => {
    await api.request(`/api/publishing/${slug}/`, { method: "DELETE" });
  },

  scheduleItem: async (slug: string, scheduled_at: string, timezone: string = "UTC"): Promise<PublishItem> => {
    return api.post<PublishItem>(`/api/publishing/${slug}/schedule/`, { scheduled_at, timezone });
  },

  approveItem: async (slug: string): Promise<PublishItem> => {
    return api.post<PublishItem>(`/api/publishing/${slug}/approve/`, {});
  },

  rejectItem: async (slug: string, notes?: string): Promise<PublishItem> => {
    return api.post<PublishItem>(`/api/publishing/${slug}/reject/`, { notes });
  },

  duplicateItem: async (slug: string): Promise<PublishItem> => {
    return api.post<PublishItem>(`/api/publishing/${slug}/duplicate/`, {});
  },

  publishItem: async (slug: string): Promise<PublishItem> => {
    return api.post<PublishItem>(`/api/publishing/${slug}/publish/`, {});
  }
};
