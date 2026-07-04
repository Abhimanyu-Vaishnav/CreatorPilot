import { api } from "../../../lib/api";
import { KnowledgeItem, CreateKnowledgeInput, UpdateKnowledgeInput, KnowledgeFilterParams } from "../types";

export const vaultService = {
  getKnowledgeItems: async (params?: KnowledgeFilterParams): Promise<KnowledgeItem[]> => {
    let endpoint = "/api/knowledge/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.pinned !== undefined) queryParts.push(`pinned=${params.pinned}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    const response = await api.get<any>(endpoint);
    if (response && response.results) {
      return response.results;
    }
    return response || [];
  },

  getProjectKnowledgeItems: async (projectSlug: string, params?: KnowledgeFilterParams): Promise<KnowledgeItem[]> => {
    let endpoint = `/api/projects/${projectSlug}/knowledge/`;
    const queryParts: string[] = [];
    if (params) {
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.pinned !== undefined) queryParts.push(`pinned=${params.pinned}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    return api.get<KnowledgeItem[]>(endpoint);
  },

  getKnowledgeItem: async (slug: string): Promise<KnowledgeItem> => {
    return api.get<KnowledgeItem>(`/api/knowledge/${slug}/`);
  },

  createKnowledgeItem: async (data: CreateKnowledgeInput): Promise<KnowledgeItem> => {
    return api.post<KnowledgeItem>("/api/knowledge/", data);
  },

  createProjectKnowledgeItem: async (projectSlug: string, data: CreateKnowledgeInput): Promise<KnowledgeItem> => {
    return api.post<KnowledgeItem>(`/api/projects/${projectSlug}/knowledge/`, data);
  },

  updateKnowledgeItem: async (slug: string, data: UpdateKnowledgeInput): Promise<KnowledgeItem> => {
    const response = await api.request(`/api/knowledge/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteKnowledgeItem: async (slug: string): Promise<void> => {
    await api.request(`/api/knowledge/${slug}/`, { method: "DELETE" });
  },
};
export type { KnowledgeItem, CreateKnowledgeInput, UpdateKnowledgeInput, KnowledgeFilterParams };
