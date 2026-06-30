import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsService } from "../services/projects";
import { CreateProjectInput, UpdateProjectInput, ProjectsFilterParams } from "../types";

export function useProjectsQuery(filters?: ProjectsFilterParams) {
  return useQuery({
    queryKey: ["projects", filters],
    queryFn: () => projectsService.getProjects(filters),
  });
}

export function useProjectQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["project", slug],
    queryFn: () => projectsService.getProject(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) => projectsService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateProjectInput }) =>
      projectsService.updateProject(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["project-overview", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["project-activity", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => projectsService.deleteProject(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useProjectActivityQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["project-activity", slug],
    queryFn: () => projectsService.getProjectActivity(slug),
    enabled: !!slug && enabled,
  });
}

export function useRecentActivityQuery() {
  return useQuery({
    queryKey: ["recent-activities"],
    queryFn: () => projectsService.getRecentActivity(),
  });
}

export function useProjectOverviewQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["project-overview", slug],
    queryFn: () => projectsService.getProjectOverview(slug),
    enabled: !!slug && enabled,
  });
}

export function useAddActivityMutation(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, metadata = {} }: { action: string; metadata?: Record<string, any> }) =>
      projectsService.postProjectActivity(slug, action, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-activity", slug] });
      queryClient.invalidateQueries({ queryKey: ["project-overview", slug] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

