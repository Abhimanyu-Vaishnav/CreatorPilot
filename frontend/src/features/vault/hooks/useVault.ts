import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vaultService } from "../services/vault";
import { CreateKnowledgeInput, UpdateKnowledgeInput, KnowledgeFilterParams } from "../types";

export function useKnowledgeQuery(filters?: KnowledgeFilterParams) {
  return useQuery({
    queryKey: ["knowledge", filters],
    queryFn: () => vaultService.getKnowledgeItems(filters),
  });
}

export function useProjectKnowledgeQuery(projectSlug: string, filters?: KnowledgeFilterParams, enabled = true) {
  return useQuery({
    queryKey: ["project-knowledge", projectSlug, filters],
    queryFn: () => vaultService.getProjectKnowledgeItems(projectSlug, filters),
    enabled: !!projectSlug && enabled,
  });
}

export function useKnowledgeItemQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["knowledge-item", slug],
    queryFn: () => vaultService.getKnowledgeItem(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreateKnowledgeMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKnowledgeInput) => {
      if (projectSlug) {
        return vaultService.createProjectKnowledgeItem(projectSlug, data);
      }
      return vaultService.createKnowledgeItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateKnowledgeMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateKnowledgeInput }) =>
      vaultService.updateKnowledgeItem(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-item", data.slug] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteKnowledgeMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => vaultService.deleteKnowledgeItem(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-knowledge"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}
