import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService } from "../services/documents";
import { CreateDocumentInput, UpdateDocumentInput, DocumentsFilterParams } from "../types";

export function useDocumentsQuery(filters?: DocumentsFilterParams) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: () => documentsService.getDocuments(filters),
  });
}

export function useProjectDocumentsQuery(projectSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["project-documents", projectSlug],
    queryFn: () => documentsService.getProjectDocuments(projectSlug),
    enabled: !!projectSlug && enabled,
  });
}

export function useDocumentQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["document", slug],
    queryFn: () => documentsService.getDocument(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreateDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentInput) => documentsService.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateDocumentInput }) =>
      documentsService.updateDocument(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["project-documents"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteDocumentMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => documentsService.deleteDocument(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-documents", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-documents"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}
