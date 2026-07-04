import { api } from "../../../lib/api";
import { Task, CreateTaskInput, UpdateTaskInput, TasksFilterParams } from "../types";

export const tasksService = {
  getTasks: async (params?: TasksFilterParams): Promise<Task[]> => {
    let endpoint = "/api/tasks/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.priority) queryParts.push(`priority=${encodeURIComponent(params.priority)}`);
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
      if (params.due_today !== undefined) queryParts.push(`due_today=${params.due_today}`);
      if (params.overdue !== undefined) queryParts.push(`overdue=${params.overdue}`);
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

  getProjectTasks: async (projectSlug: string): Promise<Task[]> => {
    return api.get<Task[]>(`/api/projects/${projectSlug}/tasks/`);
  },

  getTask: async (id: number | string): Promise<Task> => {
    return api.get<Task>(`/api/tasks/${id}/`);
  },

  createTask: async (data: CreateTaskInput): Promise<Task> => {
    return api.post<Task>("/api/tasks/", data);
  },

  updateTask: async (id: number | string, data: UpdateTaskInput): Promise<Task> => {
    const response = await api.request(`/api/tasks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteTask: async (id: number | string): Promise<void> => {
    await api.request(`/api/tasks/${id}/`, { method: "DELETE" });
  },

  reorderTasks: async (taskIds: (number | string)[], status?: string): Promise<void> => {
    const response = await api.request("/api/tasks/reorder/", {
      method: "POST",
      body: JSON.stringify({ task_ids: taskIds, status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
  }
};
