import { api } from "../../../lib/api";
import { CalendarEvent, CreateEventInput, UpdateEventInput, CalendarFilterParams } from "../types";

export const plannerService = {
  getEvents: async (params?: CalendarFilterParams): Promise<CalendarEvent[]> => {
    let endpoint = "/api/calendar/";
    const queryParts: string[] = [];
    if (params) {
      if (params.start_date) queryParts.push(`start_date=${encodeURIComponent(params.start_date)}`);
      if (params.end_date) queryParts.push(`end_date=${encodeURIComponent(params.end_date)}`);
      if (params.start) queryParts.push(`start=${encodeURIComponent(params.start)}`);
      if (params.end) queryParts.push(`end=${encodeURIComponent(params.end)}`);
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.event_type) queryParts.push(`event_type=${encodeURIComponent(params.event_type)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.today !== undefined) queryParts.push(`today=${params.today}`);
      if (params.upcoming !== undefined) queryParts.push(`upcoming=${params.upcoming}`);
      if (params.completed_tasks !== undefined) queryParts.push(`completed_tasks=${params.completed_tasks}`);
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

  getEvent: async (id: string): Promise<CalendarEvent> => {
    return api.get<CalendarEvent>(`/api/calendar/${id}/`);
  },

  createEvent: async (data: CreateEventInput): Promise<CalendarEvent> => {
    return api.post<CalendarEvent>("/api/calendar/", data);
  },

  updateEvent: async (id: string, data: UpdateEventInput): Promise<CalendarEvent> => {
    const response = await api.request(`/api/calendar/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteEvent: async (id: string): Promise<void> => {
    const response = await api.request(`/api/calendar/${id}/`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
  },
};
