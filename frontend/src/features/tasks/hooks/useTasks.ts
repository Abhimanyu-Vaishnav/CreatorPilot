import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "../services/tasks";
import { CreateTaskInput, UpdateTaskInput, TasksFilterParams } from "../types";

export function useTasksQuery(filters?: TasksFilterParams) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => tasksService.getTasks(filters),
  });
}

export function useProjectTasksQuery(projectSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["project-tasks", projectSlug],
    queryFn: () => tasksService.getProjectTasks(projectSlug),
    enabled: !!projectSlug && enabled,
  });
}

export function useTaskQuery(id: number | string, enabled = true) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksService.getTask(id),
    enabled: !!id && enabled,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateTaskInput }) =>
      tasksService.updateTask(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.id] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteTaskMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => tasksService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-tasks", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useReorderTasksMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, status }: { taskIds: (number | string)[]; status?: string }) =>
      tasksService.reorderTasks(taskIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-tasks", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["project"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}
