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
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => projectsService.deleteProject(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
