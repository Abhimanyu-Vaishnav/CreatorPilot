import { api } from "../../../lib/api";
import { Project, CreateProjectInput, UpdateProjectInput, ProjectsFilterParams } from "../types";

export const projectsService = {
  getProjects: async (params?: ProjectsFilterParams): Promise<{ results: Project[]; count: number }> => {
    let endpoint = "/api/projects/";
    const queryParts: string[] = [];
    if (params) {
      if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);
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

  getProject: async (slug: string): Promise<Project> => {
    return api.get<Project>(`/api/projects/${slug}/`);
  },

  createProject: async (data: CreateProjectInput): Promise<Project> => {
    return api.post<Project>("/api/projects/", data);
  },

  updateProject: async (slug: string, data: UpdateProjectInput): Promise<Project> => {
    const response = await api.request(`/api/projects/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteProject: async (slug: string): Promise<void> => {
    await api.request(`/api/projects/${slug}/`, { method: "DELETE" });
  }
};
