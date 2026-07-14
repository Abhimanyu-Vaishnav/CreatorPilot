"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import {
  usePublishItemsQuery,
  useCreatePublishItemMutation,
  useUpdatePublishItemMutation,
  useDeletePublishItemMutation,
  useScheduleItemMutation,
  useApproveItemMutation,
  useRejectItemMutation,
  useDuplicateItemMutation,
  usePublishItemMutation,
  PublishItem
} from "../../../features/publishing";
import { PublishingSidebar } from "../../../features/publishing/components/PublishingSidebar";
import { PublishingToolbar } from "../../../features/publishing/components/PublishingToolbar";
import { PublishingCard } from "../../../features/publishing/components/PublishingCard";
import { PublishingEditor } from "../../../features/publishing/components/PublishingEditor";
import { PublishingPreview } from "../../../features/publishing/components/PublishingPreview";
import { ScheduleDialog, ApprovalDialog, PublishDialog } from "../../../features/publishing/components/Dialogs";
import * as Icons from "lucide-react";

function PublishingWorkspaceContent() {
  // Navigation filters
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [ordering, setOrdering] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selection states
  const [selectedItem, setSelectedItem] = useState<PublishItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Dialog control states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Queries
  const { data: itemsData, isLoading } = usePublishItemsQuery({
    status: statusFilter || undefined,
    platform: platformFilter || undefined,
    project: projectFilter || undefined,
    search: searchQuery || undefined,
    ordering: ordering as any
  });
  const items = itemsData?.results || [];

  // Mutations
  const createMutation = useCreatePublishItemMutation();
  const updateMutation = useUpdatePublishItemMutation();
  const deleteMutation = useDeletePublishItemMutation();
  const scheduleMutation = useScheduleItemMutation();
  const approveMutation = useApproveItemMutation();
  const rejectMutation = useRejectItemMutation();
  const duplicateMutation = useDuplicateItemMutation();
  const publishMutation = usePublishItemMutation();

  // Workflow Handlers
  const handleSave = async (data: any) => {
    try {
      if (itemEditOrNull()) {
        const slug = itemEditOrNull()!.slug;
        await updateMutation.mutateAsync({ slug, data });
        // Refresh local selection
        const updated = { ...itemEditOrNull()!, ...data };
        setSelectedItem(updated);
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      alert("Error saving: " + JSON.stringify(err));
    }
  };

  const handleDuplicate = async () => {
    if (!selectedItem) return;
    try {
      await duplicateMutation.mutateAsync(selectedItem.slug);
    } catch (err) {
      alert("Error duplicating: " + JSON.stringify(err));
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (confirm("Are you sure you want to delete this publishing item?")) {
      try {
        await deleteMutation.mutateAsync(selectedItem.slug);
        setSelectedItem(null);
      } catch (err) {
        alert("Error deleting: " + JSON.stringify(err));
      }
    }
  };

  const handleScheduleConfirm = async (scheduledAt: string, timezone: string) => {
    if (!selectedItem) return;
    try {
      await scheduleMutation.mutateAsync({
        slug: selectedItem.slug,
        scheduledAt,
        timezone
      });
      // reload item locally
      setSelectedItem((prev) => prev ? { ...prev, status: "Scheduled", scheduled_at: scheduledAt, timezone } : null);
    } catch (err) {
      alert("Error scheduling: " + JSON.stringify(err));
    }
  };

  const handleApproveConfirm = async () => {
    if (!selectedItem) return;
    try {
      await approveMutation.mutateAsync(selectedItem.slug);
      setSelectedItem((prev) => prev ? { ...prev, approval_status: "Approved" } : null);
    } catch (err) {
      alert("Error approving: " + JSON.stringify(err));
    }
  };

  const handleRejectConfirm = async (notes: string) => {
    if (!selectedItem) return;
    try {
      await rejectMutation.mutateAsync({ slug: selectedItem.slug, notes });
      setSelectedItem((prev) => prev ? { ...prev, approval_status: "Rejected", status: "Draft" } : null);
    } catch (err) {
      alert("Error rejecting: " + JSON.stringify(err));
    }
  };

  const handlePublishConfirm = async () => {
    if (!selectedItem) return;
    try {
      await publishMutation.mutateAsync(selectedItem.slug);
      setSelectedItem((prev) => prev ? { ...prev, status: "Published", published_at: new Date().toISOString() } : null);
    } catch (err) {
      alert("Error publishing: " + JSON.stringify(err));
    }
  };

  const itemEditOrNull = () => {
    if (isCreating) return null;
    return selectedItem;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Sidebar Filters */}
      <PublishingSidebar
        currentStatus={statusFilter}
        setStatus={setStatusFilter}
        currentPlatform={platformFilter}
        setPlatform={setPlatformFilter}
        currentProject={projectFilter}
        setProject={setProjectFilter}
      />

      {/* Main Queue Content */}
      <div className="flex-1 space-y-4 w-full">
        <PublishingToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          ordering={ordering}
          setOrdering={setOrdering}
          onCreateNew={() => {
            setSelectedItem(null);
            setIsCreating(true);
            setIsEditing(true);
          }}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Icons.Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
              <Icons.FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">No Publishing Items Found</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Get started by creating your first publishing workflow card for your social media channels or blogs.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedItem(null);
                setIsCreating(true);
                setIsEditing(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Create Draft
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {items.map((item) => (
              <PublishingCard
                key={item.id}
                item={item}
                onClick={(it) => {
                  setSelectedItem(it);
                  setIsEditing(false);
                  setIsCreating(false);
                }}
                isSelected={selectedItem?.id === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right panel Detail/Editor Workspace */}
      <div className="w-full lg:w-96 space-y-6">
        {isEditing ? (
          <PublishingEditor
            item={itemEditOrNull()}
            onSave={handleSave}
            onCancel={() => {
              setIsEditing(false);
              setIsCreating(false);
            }}
          />
        ) : selectedItem ? (
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 space-y-6 shadow-sm">
            {/* Header / Meta */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase font-bold tracking-wider text-zinc-600 dark:text-zinc-400">
                  {selectedItem.platform_details.name}
                </span>
                <h3 className="font-bold text-base text-zinc-950 dark:text-zinc-50 mt-1">
                  {selectedItem.title}
                </h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                  title="Edit post"
                >
                  <Icons.Edit3 size={14} />
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                  title="Duplicate post"
                >
                  <Icons.Copy size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                  title="Delete post"
                >
                  <Icons.Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl space-y-3">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Publishing Controls
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsApprovalOpen(true)}
                  className="flex items-center justify-center gap-1.5 h-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  <Icons.ShieldCheck size={13} />
                  Review Draft
                </button>
                <button
                  onClick={() => setIsScheduleOpen(true)}
                  className="flex items-center justify-center gap-1.5 h-8 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  <Icons.Calendar size={13} />
                  Schedule Post
                </button>
                <button
                  onClick={() => setIsPublishOpen(true)}
                  className="col-span-2 flex items-center justify-center gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md"
                >
                  <Icons.Globe size={13} />
                  Publish Immediately
                </button>
              </div>
            </div>

            {/* Platform live mockup preview */}
            <PublishingPreview item={selectedItem} />

            {/* Details details */}
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 text-xs">
              {/* Linked Writing Doc */}
              {selectedItem.document && (
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/40 dark:border-zinc-800/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.FileText size={13} className="text-zinc-400" />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                      {selectedItem.document_title}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Linked Doc</span>
                </div>
              )}

              {/* Linked Featured Media */}
              {selectedItem.featured_media && (
                <div className="flex items-center justify-between p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200/40 dark:border-zinc-800/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.Image size={13} className="text-zinc-400" />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                      {selectedItem.featured_media_details?.title || "Featured Media"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Linked Media</span>
                </div>
              )}
            </div>

            {/* Timeline Logs */}
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Activity Timeline
              </span>
              <div className="space-y-3 relative pl-3.5 border-l border-zinc-200 dark:border-zinc-800">
                {selectedItem.history?.map((hist, idx) => (
                  <div key={hist.id || idx} className="space-y-0.5 relative text-xs">
                    {/* Circle marker */}
                    <div className="absolute -left-[19.5px] top-1 w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 border-2 border-white dark:border-[#0c0c0f]" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {hist.action}
                      </span>
                      <span className="text-[9px] text-zinc-400">
                        {new Date(hist.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {hist.notes && (
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                        {hist.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 dark:text-zinc-600 text-xs">
            <Icons.Layers size={22} className="mx-auto mb-2 opacity-50" />
            Select an item from the queue to view mockups, activity history, and control scheduled dates.
          </div>
        )}
      </div>

      {/* Dialog Components */}
      <ScheduleDialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onConfirm={handleScheduleConfirm}
      />
      <ApprovalDialog
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        onApprove={handleApproveConfirm}
        onReject={handleRejectConfirm}
      />
      <PublishDialog
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
}

export default function PublishingWorkspace() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <Icons.Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      }>
        <PublishingWorkspaceContent />
      </Suspense>
    </DashboardLayout>
  );
}
