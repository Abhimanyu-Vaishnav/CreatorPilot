import { api } from "../../../lib/api";
import { Note, CreateNoteInput, UpdateNoteInput, NotesFilterParams } from "../types";

export const notesService = {
  getNotes: async (params?: NotesFilterParams): Promise<Note[]> => {
    let endpoint = "/api/notes/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.pinned !== undefined) queryParts.push(`pinned=${params.pinned}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    const response = await api.get<any>(endpoint);
    // Handle paginated or list response
    if (response && response.results) {
      return response.results;
    }
    return response || [];
  },

  getProjectNotes: async (projectSlug: string): Promise<Note[]> => {
    return api.get<Note[]>(`/api/projects/${projectSlug}/notes/`);
  },

  getNote: async (slug: string): Promise<Note> => {
    return api.get<Note>(`/api/notes/${slug}/`);
  },

  createNote: async (data: CreateNoteInput): Promise<Note> => {
    return api.post<Note>("/api/notes/", data);
  },

  updateNote: async (slug: string, data: UpdateNoteInput): Promise<Note> => {
    const response = await api.request(`/api/notes/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteNote: async (slug: string): Promise<void> => {
    await api.request(`/api/notes/${slug}/`, { method: "DELETE" });
  },
};
