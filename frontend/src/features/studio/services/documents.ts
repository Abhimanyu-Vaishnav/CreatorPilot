import { api } from "../../../lib/api";
import { Document, CreateDocumentInput, UpdateDocumentInput, DocumentsFilterParams } from "../types";

export const documentsService = {
  getDocuments: async (params?: DocumentsFilterParams): Promise<Document[]> => {
    let endpoint = "/api/documents/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.visibility) queryParts.push(`visibility=${encodeURIComponent(params.visibility)}`);
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

  getProjectDocuments: async (projectSlug: string): Promise<Document[]> => {
    return api.get<Document[]>(`/api/projects/${projectSlug}/documents/`);
  },

  getDocument: async (slug: string): Promise<Document> => {
    return api.get<Document>(`/api/documents/${slug}/`);
  },

  createDocument: async (data: CreateDocumentInput): Promise<Document> => {
    return api.post<Document>("/api/documents/", data);
  },

  updateDocument: async (slug: string, data: UpdateDocumentInput): Promise<Document> => {
    const response = await api.request(`/api/documents/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteDocument: async (slug: string): Promise<void> => {
    await api.request(`/api/documents/${slug}/`, { method: "DELETE" });
  },
};
