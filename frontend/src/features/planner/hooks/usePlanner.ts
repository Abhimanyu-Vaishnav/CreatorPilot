import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plannerService } from "../services/planner";
import { CreateEventInput, UpdateEventInput, CalendarFilterParams } from "../types";

export function useCalendarEventsQuery(filters?: CalendarFilterParams) {
  return useQuery({
    queryKey: ["calendar-events", filters],
    queryFn: () => plannerService.getEvents(filters),
  });
}

export function useCalendarEventQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: ["calendar-event", id],
    queryFn: () => plannerService.getEvent(id),
    enabled: !!id && enabled,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput) => plannerService.createEvent(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Invalidate tasks in case a task was linked
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      if (data.project_slug) {
        queryClient.invalidateQueries({ queryKey: ["project-activity", data.project_slug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", data.project_slug] });
      }
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventInput }) =>
      plannerService.updateEvent(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-event", data.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      if (data.project_slug) {
        queryClient.invalidateQueries({ queryKey: ["project-activity", data.project_slug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", data.project_slug] });
      }
    },
  });
}

export function useDeleteEventMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plannerService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
      }
    },
  });
}
