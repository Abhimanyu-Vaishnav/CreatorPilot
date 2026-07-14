import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaService } from "../services/media";
import { UpdateMediaAssetInput, MediaAssetFilterParams, CreateMediaFolderInput } from "../types";

export function useMediaQuery(filters?: MediaAssetFilterParams) {
  return useQuery({
    queryKey: ["media", filters],
    queryFn: () => mediaService.getMediaAssets(filters),
  });
}

export function useProjectMediaQuery(projectSlug: string, filters?: MediaAssetFilterParams, enabled = true) {
  return useQuery({
    queryKey: ["project-media", projectSlug, filters],
    queryFn: () => mediaService.getProjectMediaAssets(projectSlug, filters),
    enabled: !!projectSlug && enabled,
  });
}

export function useMediaAssetQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["media-item", slug],
    queryFn: () => mediaService.getMediaAsset(slug),
    enabled: !!slug && enabled,
  });
}

// Folders Hooks
export function useFoldersQuery(params?: { project?: string | number; parent?: string | number | null }, enabled = true) {
  return useQuery({
    queryKey: ["folders", params],
    queryFn: () => mediaService.getMediaFolders(params),
    enabled: enabled,
  });
}

export function useCreateFolderMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMediaFolderInput) => mediaService.createMediaFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      }
    },
  });
}

export function useDeleteFolderMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => mediaService.deleteMediaFolder(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
      }
    },
  });
}

// Media mutations
export function useCreateMediaMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => mediaService.createMediaAsset(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useUpdateMediaMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateMediaAssetInput }) =>
      mediaService.updateMediaAsset(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["media-item", data.slug] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDeleteMediaMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => mediaService.deleteMediaAsset(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"], exact: false });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug], exact: false });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

export function useDuplicateMediaMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => mediaService.duplicateMediaAsset(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
        queryClient.invalidateQueries({ queryKey: ["project-activity", projectSlug] });
      }
      queryClient.invalidateQueries({ queryKey: ["recent-activities"] });
    },
  });
}

// Bulk Actions mutations
export function useBulkFavoriteMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slugs, favorite }: { slugs: string[]; favorite: boolean }) =>
      mediaService.bulkFavorite(slugs, favorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
      }
    },
  });
}

export function useBulkArchiveMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => mediaService.bulkArchive(slugs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
      }
    },
  });
}

export function useBulkRestoreMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => mediaService.bulkRestore(slugs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug] });
      }
    },
  });
}

export function useBulkDeleteMutation(projectSlug?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slugs: string[]) => mediaService.bulkDelete(slugs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"], exact: false });
      if (projectSlug) {
        queryClient.invalidateQueries({ queryKey: ["project-media", projectSlug], exact: false });
        queryClient.invalidateQueries({ queryKey: ["project-overview", projectSlug] });
      }
    },
  });
}
