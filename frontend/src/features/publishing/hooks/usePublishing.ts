import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { publishingService } from "../services/publishingApi";
import {
  CreatePublishItemInput,
  UpdatePublishItemInput,
  PublishingFilters
} from "../types";

export function usePlatformsQuery() {
  return useQuery({
    queryKey: ["publish-platforms"],
    queryFn: () => publishingService.getPlatforms(),
  });
}

export function usePublishItemsQuery(filters?: PublishingFilters) {
  return useQuery({
    queryKey: ["publish-items", filters],
    queryFn: () => publishingService.getPublishItems(filters),
  });
}

export function usePublishItemQuery(slug: string, enabled = true) {
  return useQuery({
    queryKey: ["publish-item", slug],
    queryFn: () => publishingService.getPublishItem(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreatePublishItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePublishItemInput) => publishingService.createPublishItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useUpdatePublishItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdatePublishItemInput }) =>
      publishingService.updatePublishItem(slug, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-item", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useDeletePublishItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishingService.deletePublishItem(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useScheduleItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, scheduledAt, timezone }: { slug: string; scheduledAt: string; timezone: string }) =>
      publishingService.scheduleItem(slug, scheduledAt, timezone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-item", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}

export function useApproveItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishingService.approveItem(slug),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-item", data.slug] });
    },
  });
}

export function useRejectItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, notes }: { slug: string; notes?: string }) =>
      publishingService.rejectItem(slug, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-item", data.slug] });
    },
  });
}

export function useDuplicateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishingService.duplicateItem(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
    },
  });
}

export function usePublishItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => publishingService.publishItem(slug),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publish-items"] });
      queryClient.invalidateQueries({ queryKey: ["publish-item", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}
