import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/notes";
import { CreateNoteInput, UpdateNoteInput, NotesFilterParams } from "../types";

export function useNotesQuery(filters?: NotesFilterParams) {
  return useQuery({
    queryKey: ["notes", filters],
    queryFn: () => notesService.getNotes(filters),
  });
}

export function useProjectNotesQuery(projectSlug: string, enabled = true) {
  return useQuery({
    queryKey: ["project-notes", projectSlug],
    queryFn: () => notesService.getProjectNotes(projectSlug),
    enabled: !!projectSlug && enabled,
  });
}

export function useNoteQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["note", slug],
    queryFn: () => notesService.getNote(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNoteInput) => notesService.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["project-notes"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateNoteInput }) =>
      notesService.updateNote(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["project-notes"] });
      queryClient.invalidateQueries({ queryKey: ["project-overview"] });
      queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteNoteMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => notesService.deleteNote(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-notes", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["project-notes"] });
        queryClient.invalidateQueries({ queryKey: ["project-overview"] });
        queryClient.invalidateQueries({ queryKey: ["project-activity"] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}
