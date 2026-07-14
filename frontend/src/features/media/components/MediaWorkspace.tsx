"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  FileText,
  File,
  List,
  Grid,
  Search,
  ArrowUpDown,
  Plus,
  Star,
  Download,
  Trash2,
  Archive,
  Loader2,
  HardDrive,
  Clock,
  ChevronRight,
  FolderPlus,
  Folder,
  ChevronLeft,
  X,
  Link as LinkIcon,
  Tag,
  Check,
  RotateCcw,
  Edit2
} from "lucide-react";
import { MediaAsset, MediaAssetType, MediaFolder, UpdateMediaAssetInput } from "../types";
import {
  useMediaQuery,
  useFoldersQuery,
  useCreateFolderMutation,
  useDeleteFolderMutation,
  useUpdateMediaMutation,
  useDuplicateMediaMutation,
  useDeleteMediaMutation,
  useBulkFavoriteMutation,
  useBulkArchiveMutation,
  useBulkRestoreMutation,
  useBulkDeleteMutation
} from "../hooks/useMedia";
import { useUploadQueue } from "../hooks/useUploadQueue";
import { MediaUploadDialog } from "./MediaUploadDialog";
import { MediaDetailsDialog } from "./MediaDetailsDialog";

const ASSET_TYPE_OPTIONS: MediaAssetType[] = [
  "Image",
  "Video",
  "Audio",
  "PDF",
  "Logo",
  "Thumbnail",
  "Document",
  "Other"
];
import { useProjectsQuery, useProjectActivityQuery } from "../../projects";
import { useProjectNotesQuery } from "../../notes";
import { useProjectKnowledgeQuery } from "../../vault";
import { useProjectTasksQuery } from "../../tasks";
import { useCalendarEventsQuery } from "../../planner";
import { useProjectDocumentsQuery } from "../../studio";

interface MediaWorkspaceProps {
  projectSlug: string;
  projectId: number;
}

export function MediaWorkspace({ projectSlug, projectId }: MediaWorkspaceProps) {
  // Navigation folders state
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Filters & limits
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState<MediaAssetType | "">("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [ordering, setOrdering] = useState("-created_at");
  const [visibleLimit, setVisibleLimit] = useState(15);

  // Multi-selection set
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  // Confirm delete dialog state
  const [confirmDelete, setConfirmDelete] = useState<{ type: "single" | "bulk"; asset?: MediaAsset } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Upload dialog & Upload queue hook
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const uploadQueue = useUploadQueue(projectSlug, projectId, currentFolderId);

  // Details sidebar & preview dialog
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Inline rename and detail edits in sidebar
  const [sidebarTitle, setSidebarTitle] = useState("");
  const [sidebarDesc, setSidebarDesc] = useState("");
  const [sidebarTags, setSidebarTags] = useState("");
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Queries
  const { data: allFolders = [] } = useFoldersQuery({ project: projectId });
  const foldersInDirectory = useMemo(() => {
    return allFolders.filter(f => f.parent === currentFolderId);
  }, [allFolders, currentFolderId]);

  const { data: paginatedData, isLoading } = useMediaQuery({
    project: projectId,
    folder: currentFolderId,
    asset_type: assetType,
    favorite: showFavorites ? true : undefined,
    archived: showArchived,
    search,
    ordering,
    limit: visibleLimit,
    offset: 0
  });

  const mediaAssets = paginatedData?.results || [];
  const totalCount = paginatedData?.count || 0;

  // Linked items lists queries for dropdown mappings
  const { data: projectsData } = useProjectsQuery();
  const projectsList = projectsData?.results || [];
  const { data: docs = [] } = useProjectDocumentsQuery(projectSlug);
  const { data: notes = [] } = useProjectNotesQuery(projectSlug);
  const { data: knowledge = [] } = useProjectKnowledgeQuery(projectSlug);
  const { data: tasks = [] } = useProjectTasksQuery(projectSlug);
  const { data: calendarEvents = [] } = useCalendarEventsQuery({ project: String(projectId) });
  const { data: activities = [] } = useProjectActivityQuery(projectSlug);

  // Mutation hooks
  const createFolderMutation = useCreateFolderMutation(projectSlug);
  const deleteFolderMutation = useDeleteFolderMutation(projectSlug);
  const updateMutation = useUpdateMediaMutation(projectSlug);
  const duplicateMutation = useDuplicateMediaMutation(projectSlug);
  const deleteMutation = useDeleteMediaMutation(projectSlug);

  // Bulk operation mutations
  const bulkFavMutation = useBulkFavoriteMutation(projectSlug);
  const bulkArchMutation = useBulkArchiveMutation(projectSlug);
  const bulkRestMutation = useBulkRestoreMutation(projectSlug);
  const bulkDelMutation = useBulkDeleteMutation(projectSlug);

  // Sync details sidebar states on selection
  useEffect(() => {
    if (selectedAsset) {
      setSidebarTitle(selectedAsset.title || "");
      setSidebarDesc(selectedAsset.description || "");
      setSidebarTags(selectedAsset.tags ? selectedAsset.tags.join(", ") : "");
      setIsEditingMetadata(false);
    }
  }, [selectedAsset]);

  // Keyboard Shortcuts integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      // Ctrl + A: Select All assets
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedSlugs(prev => {
          if (prev.size === mediaAssets.length) {
            return new Set();
          } else {
            return new Set(mediaAssets.map(m => m.slug));
          }
        });
      }

      // Delete: Delete selected
      if (e.key === "Delete") {
        e.preventDefault();
        if (selectedSlugs.size > 0) {
          handleBulkDelete();
        } else if (selectedAsset) {
          handleDeleteAsset(selectedAsset);
        }
      }

      // Space: Large Preview
      if (e.key === " " && selectedAsset) {
        e.preventDefault();
        setIsPreviewOpen(true);
      }

      // F / f: Favorite toggle
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (selectedSlugs.size > 0) {
          const allFav = Array.from(selectedSlugs).every(s => mediaAssets.find(m => m.slug === s)?.favorite);
          bulkFavMutation.mutate({ slugs: Array.from(selectedSlugs), favorite: !allFav });
        } else if (selectedAsset) {
          updateMutation.mutate({ slug: selectedAsset.slug, data: { favorite: !selectedAsset.favorite } });
        }
      }

      // A / a: Archive toggle
      if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (selectedSlugs.size > 0) {
          bulkArchMutation.mutate(Array.from(selectedSlugs), { onSuccess: () => setSelectedSlugs(new Set()) });
        } else if (selectedAsset) {
          updateMutation.mutate({ slug: selectedAsset.slug, data: { archived: !selectedAsset.archived } });
        }
      }

      // R / r: Rename editing
      if (e.key.toLowerCase() === "r" && selectedAsset) {
        e.preventDefault();
        setIsEditingMetadata(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mediaAssets, selectedSlugs, selectedAsset]);

  // Compute Breadcrumbs Path
  const breadcrumbs = useMemo(() => {
    const path = [];
    let currentId = currentFolderId;
    while (currentId !== null) {
      const folder = allFolders.find(f => f.id === currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parent;
    }
    return path;
  }, [currentFolderId, allFolders]);

  // Calculate storage size indicators
  const totalStorageBytes = useMemo(() => {
    return mediaAssets.reduce((sum, item) => sum + item.file_size, 0);
  }, [mediaAssets]);

  const storageLimit = 500 * 1024 * 1024; // 500 MB limit
  const storagePercentage = Math.min(100, (totalStorageBytes / storageLimit) * 100);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getAssetIcon = (type: MediaAssetType) => {
    switch (type) {
      case "Image":
      case "Logo":
      case "Thumbnail":
        return <ImageIcon size={16} />;
      case "Video":
        return <Video size={16} />;
      case "Audio":
        return <FileText size={16} className="text-emerald-500" />;
      case "PDF":
        return <FileText size={16} className="text-rose-500" />;
      default:
        return <File size={16} />;
    }
  };

  // Folder actions
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName,
        project: projectId,
        parent: currentFolderId
      });
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async (folder: MediaFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? This will also remove any assets linked inside.`)) {
      try {
        await deleteFolderMutation.mutateAsync(folder.slug);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Selection toggle
  const toggleSelectAsset = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlugs(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  // Bulk Actions
  const handleBulkFavorite = () => {
    const list = Array.from(selectedSlugs);
    const allFav = list.every(s => mediaAssets.find(m => m.slug === s)?.favorite);
    bulkFavMutation.mutate({ slugs: list, favorite: !allFav }, {
      onSuccess: () => setSelectedSlugs(new Set())
    });
  };

  const handleBulkArchive = () => {
    bulkArchMutation.mutate(Array.from(selectedSlugs), {
      onSuccess: () => setSelectedSlugs(new Set())
    });
  };

  const handleBulkRestore = () => {
    bulkRestMutation.mutate(Array.from(selectedSlugs), {
      onSuccess: () => setSelectedSlugs(new Set())
    });
  };

  const handleBulkDelete = () => {
    setDeleteError(null);
    setConfirmDelete({ type: "bulk" });
  };

  const executeBulkDelete = () => {
    bulkDelMutation.mutate(Array.from(selectedSlugs), {
      onSuccess: () => {
        setSelectedSlugs(new Set());
        setConfirmDelete(null);
      },
      onError: (err: any) => {
        setDeleteError(err?.message || "Bulk delete failed. Please try again.");
      }
    });
  };

  // Single asset actions
  const handleDeleteAsset = (asset: MediaAsset) => {
    setDeleteError(null);
    setConfirmDelete({ type: "single", asset });
  };

  const executeSingleDelete = async (asset: MediaAsset) => {
    try {
      await deleteMutation.mutateAsync(asset.slug);
      setSelectedAsset(null);
      setConfirmDelete(null);
    } catch (err: any) {
      setDeleteError(err?.message || "Delete failed. Please try again.");
    }
  };

  const handleSaveSidebarMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const tags = sidebarTags
        ? sidebarTags.split(",").map(t => t.trim()).filter(Boolean)
        : [];
      const updated = await updateMutation.mutateAsync({
        slug: selectedAsset.slug,
        data: {
          title: sidebarTitle,
          description: sidebarDesc,
          tags
        }
      });
      setSelectedAsset(updated);
      setIsEditingMetadata(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkChange = async (field: keyof UpdateMediaAssetInput, val: any) => {
    if (!selectedAsset) return;
    try {
      const updated = await updateMutation.mutateAsync({
        slug: selectedAsset.slug,
        data: { [field]: val || null }
      });
      setSelectedAsset(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Scroll loader for Infinite Scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (mediaAssets.length < totalCount && !isLoading) {
        setVisibleLimit(prev => prev + 15);
      }
    }
  };

  // Filter activities to current selected asset
  const filteredActivities = useMemo(() => {
    if (!selectedAsset) return [];
    return activities.filter(a => a.metadata?.media_slug === selectedAsset.slug);
  }, [activities, selectedAsset]);

  // Persistent Upload progress bar values
  const activeUploads = uploadQueue.queue.filter(t => t.status === "uploading" || t.status === "queued");

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)] relative overflow-hidden font-sans">

      {/* Main Workspace Section */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" onScroll={handleScroll}>
        
        {/* Storage usage, Folder Creation bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-[#0e0e11] border border-zinc-200/50 dark:border-zinc-850 rounded-2xl shadow-sm shrink-0">
          
          {/* Left: Storage usage indicator progress bar */}
          <div className="flex items-center gap-3 font-semibold text-xs text-zinc-550 dark:text-zinc-400">
            <HardDrive size={15} />
            <div className="space-y-1">
              <div>Storage: <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatBytes(totalStorageBytes)}</span> / 500 MB</div>
              <div className="w-40 bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 overflow-hidden">
                <div className="bg-indigo-650 h-full" style={{ width: `${storagePercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Right: Breadcrumbs and folder actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus size={13} />
              New Folder
            </button>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Plus size={14} />
              Upload Queue ({activeUploads.length} active)
            </button>
          </div>

        </div>

        {/* Directory Breadcrumbs and Navigation */}
        <div className="flex items-center justify-between py-2 border-b border-zinc-200/40 dark:border-zinc-900/60 mt-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-450">
            <button
              onClick={() => setCurrentFolderId(null)}
              className={`hover:text-indigo-600 ${currentFolderId === null ? "text-zinc-800 dark:text-zinc-100" : ""}`}
            >
              Project Files
            </button>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.id}>
                <ChevronRight size={12} className="text-zinc-400" />
                <button
                  onClick={() => setCurrentFolderId(b.id)}
                  className={`hover:text-indigo-600 ${currentFolderId === b.id ? "text-zinc-800 dark:text-zinc-100" : ""}`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Sorting */}
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="h-8 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 text-[11px] font-semibold focus:border-indigo-500 focus:outline-none dark:text-zinc-200 cursor-pointer"
            >
              <option value="-created_at">Newest Uploads</option>
              <option value="created_at">Oldest Uploads</option>
              <option value="title">Name (A-Z)</option>
              <option value="-title">Name (Z-A)</option>
              <option value="-file_size">File Size (Max)</option>
            </select>

            {/* Layout view modes toggle */}
            <div className="flex items-center border border-zinc-200 dark:border-zinc-850 p-0.5 rounded-lg bg-zinc-50/30 dark:bg-zinc-900/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded ${viewMode === "grid" ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-400"}`}
              >
                <Grid size={12} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded ${viewMode === "list" ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600" : "text-zinc-400"}`}
              >
                <List size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2 py-2.5 px-1 shrink-0">
          {/* Search */}
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex-1 min-w-[160px]">
            <Search size={12} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-semibold outline-none text-zinc-700 dark:text-zinc-200 placeholder-zinc-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X size={11} />
              </button>
            )}
          </div>

          {/* Asset Type Filter */}
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as MediaAssetType | "")}
            className="h-8 px-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 text-[11px] font-semibold focus:border-indigo-500 focus:outline-none dark:text-zinc-200 cursor-pointer"
          >
            <option value="">All Types</option>
            {ASSET_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavorites(f => !f)}
            className={`h-8 px-3 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFavorites
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-amber-400 hover:text-amber-500"
            }`}
          >
            <Star size={11} className={showFavorites ? "fill-white text-white" : ""} />
            Favorites
          </button>

          {/* Archived Toggle */}
          <button
            onClick={() => {
              setShowArchived(a => !a);
              setSelectedSlugs(new Set());
            }}
            className={`h-8 px-3 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showArchived
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-violet-400 hover:text-violet-600"
            }`}
          >
            <Archive size={11} />
            {showArchived ? "Viewing Archived" : "Show Archived"}
          </button>

          {/* Select All */}
          {mediaAssets.length > 0 && (
            <button
              onClick={() => {
                if (selectedSlugs.size === mediaAssets.length) {
                  setSelectedSlugs(new Set());
                } else {
                  setSelectedSlugs(new Set(mediaAssets.map(m => m.slug)));
                }
              }}
              className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:border-indigo-400 hover:text-indigo-600 dark:text-zinc-400 cursor-pointer"
            >
              <Check size={11} />
              {selectedSlugs.size === mediaAssets.length && mediaAssets.length > 0 ? "Deselect All" : "Select All"}
            </button>
          )}

          {/* Results count */}
          <span className="ml-auto text-[10px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
            {totalCount} {showArchived ? "archived" : "active"} {totalCount === 1 ? "file" : "files"}
          </span>
        </div>

        {/* List folders + assets in directory */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4" onScroll={handleScroll}>
          {/* Folders block */}
          {foldersInDirectory.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Folders</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 font-semibold text-xs">
                {foldersInDirectory.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-850 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/20 shadow-sm flex items-center justify-between group cursor-pointer transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder size={16} className="text-amber-500 shrink-0" />
                      <span className="truncate text-zinc-800 dark:text-zinc-200">{folder.name}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFolder(folder, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-500 rounded transition-all cursor-pointer"
                      title="Delete Folder"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media assets list */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {showArchived ? "Archived Assets" : "Assets"}
              </span>
              {showArchived && (
                <span className="text-[9px] bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-bold">
                  ARCHIVE VIEW
                </span>
              )}
            </div>


            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
              </div>
            ) : mediaAssets.length === 0 ? (
              <div className="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-zinc-450 dark:text-zinc-550 font-bold space-y-2">
                {showArchived ? (
                  <>
                    <Archive size={24} className="mx-auto text-violet-400 mb-2" />
                    <p>No archived files found.</p>
                    <p className="text-[10px] font-medium text-zinc-400">Archive assets from the media grid or sidebar to see them here.</p>
                  </>
                ) : (
                  <>
                    <p>No assets in this directory.</p>
                    <p className="text-[10px] font-medium text-zinc-400">Click Upload to add files, or use &quot;Show Archived&quot; to view archived media.</p>
                  </>
                )}
              </div>
            ) : viewMode === "grid" ? (
              /* Grid layouts with multi selection */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaAssets.map((asset) => {
                  const isSelected = selectedSlugs.has(asset.slug);
                  const isImg = ["Image", "Logo", "Thumbnail"].includes(asset.asset_type);
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`group border rounded-2xl bg-white dark:bg-[#0e0e11] overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5 relative ${
                        isSelected
                          ? "border-indigo-500 shadow shadow-indigo-500/10"
                          : "border-zinc-200/50 dark:border-zinc-850 hover:border-indigo-500/20"
                      }`}
                    >
                      {/* Selection checkbox overlay */}
                      <button
                        onClick={(e) => toggleSelectAsset(asset.slug, e)}
                        className={`absolute top-2 left-2 z-10 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white/90 dark:bg-black/50 border-zinc-350 dark:border-zinc-700 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {isSelected && <Check size={10} />}
                      </button>

                      {/* Image/File thumbnail */}
                      <div className="relative aspect-video bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-center overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
                        {isImg && asset.thumbnail_url ? (
                          <img
                            src={asset.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                            {getAssetIcon(asset.asset_type)}
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMutation.mutate({ slug: asset.slug, data: { favorite: !asset.favorite } });
                            }}
                            className="p-1 rounded bg-zinc-900/50 text-zinc-150 hover:text-amber-500 transition-colors"
                          >
                            <Star size={10} className={asset.favorite ? "fill-amber-500 text-amber-500" : ""} />
                          </button>
                        </div>
                      </div>

                      {/* Details info */}
                      <div className="p-3 space-y-1 bg-white dark:bg-[#0e0e11] font-semibold text-xs">
                        <h4 className="font-bold text-zinc-850 dark:text-zinc-200 truncate leading-snug">{asset.title}</h4>
                        <div className="flex justify-between items-center text-[9px] text-zinc-400">
                          <span>{formatBytes(asset.file_size)}</span>
                          <span className="truncate max-w-[80px] font-mono opacity-80">{asset.file_name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List layout with multi selection */
              <div className="border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-zinc-50/50 dark:bg-zinc-900/20 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900">
                    <tr>
                      <th className="p-3 pl-4 w-10">Select</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50 text-zinc-700 dark:text-zinc-350">
                    {mediaAssets.map((asset) => {
                      const isSelected = selectedSlugs.has(asset.slug);
                      return (
                        <tr
                          key={asset.id}
                          onClick={() => setSelectedAsset(asset)}
                          className={`hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 cursor-pointer ${
                            isSelected ? "bg-indigo-50/5 dark:bg-indigo-950/5" : ""
                          }`}
                        >
                          <td className="p-3 pl-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => toggleSelectAsset(asset.slug, e)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-white dark:bg-black/50 border-zinc-300 dark:border-zinc-750"
                              }`}
                            >
                              {isSelected && <Check size={10} />}
                            </button>
                          </td>
                          <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              {getAssetIcon(asset.asset_type)}
                            </div>
                            <span className="truncate max-w-[150px]">{asset.title}</span>
                            {asset.favorite && <Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-zinc-400">{asset.file_name}</td>
                          <td className="p-3">
                            <span className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[9px] uppercase font-extrabold text-zinc-500">
                              {asset.asset_type}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-zinc-550">{formatBytes(asset.file_size)}</td>
                          <td className="p-3 text-[10px] text-zinc-500">{new Date(asset.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Collapsible Metadata sidebar */}
      {selectedAsset && (
        <div className="w-[320px] bg-white dark:bg-[#0e0e11] border-l border-zinc-200 dark:border-zinc-800 h-full flex flex-col justify-between p-4 shrink-0 shadow-xl z-20 animate-slideLeft">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">Metadata Detail</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => isEditingMetadata ? setIsEditingMetadata(false) : setIsEditingMetadata(true)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-800 transition-colors cursor-pointer"
                title="Edit details"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Details Scroll Content */}
          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5 scrollbar-thin text-xs font-semibold text-zinc-850 dark:text-zinc-250">
            
            {/* Inline Rename Form */}
            {isEditingMetadata ? (
              <form onSubmit={handleSaveSidebarMetadata} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-450 uppercase tracking-wider">Rename Title</label>
                  <input
                    type="text"
                    value={sidebarTitle}
                    onChange={(e) => setSidebarTitle(e.target.value)}
                    required
                    className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-455 uppercase tracking-wider">Description</label>
                  <textarea
                    rows={2}
                    value={sidebarDesc}
                    onChange={(e) => setSidebarDesc(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-455 uppercase tracking-wider">Tags</label>
                  <input
                    type="text"
                    value={sidebarTags}
                    onChange={(e) => setSidebarTags(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-8 rounded-lg bg-indigo-650 text-white font-bold text-[11px] shadow transition-all cursor-pointer"
                >
                  Save Updates
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm leading-tight">{selectedAsset.title}</h4>
                  <p className="text-[10px] text-zinc-450 mt-1 font-mono">{selectedAsset.file_name}</p>
                </div>
                {/* Desc */}
                {selectedAsset.description && (
                  <p className="text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed bg-zinc-50/20 dark:bg-zinc-900/10 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900/50">
                    {selectedAsset.description}
                  </p>
                )}
                {/* Tags */}
                {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedAsset.tags.map(t => (
                      <span key={t} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 px-2 py-0.5 rounded text-[9px] font-bold">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Re-assignment dropdown */}
            <div className="space-y-1.5 border-t border-zinc-200/40 dark:border-zinc-800 pt-3">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><HardDrive size={10} /> Move to Project</span>
              <select
                value={selectedAsset.project}
                onChange={(e) => handleLinkChange("project", Number(e.target.value))}
                className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
              >
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Folder Re-assignment dropdown */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><Folder size={10} /> Select Folder</span>
              <select
                value={selectedAsset.folder || ""}
                onChange={(e) => handleLinkChange("folder", e.target.value ? Number(e.target.value) : null)}
                className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
              >
                <option value="">Root / None</option>
                {allFolders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Linked Entities links */}
            <div className="space-y-3.5 border-t border-zinc-200/40 dark:border-zinc-800 pt-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Linked Entities</span>

              {/* Linked Note */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-450 uppercase flex items-center gap-1"><FileText size={10} /> Link Note</label>
                <select
                  value={selectedAsset.related_note || ""}
                  onChange={(e) => handleLinkChange("related_note", e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
                >
                  <option value="">No note linked</option>
                  {notes.map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>

              {/* Linked Document */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-450 uppercase flex items-center gap-1"><FileText size={10} /> Link Document</label>
                <select
                  value={selectedAsset.related_document || ""}
                  onChange={(e) => handleLinkChange("related_document", e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
                >
                  <option value="">No document linked</option>
                  {docs.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              {/* Linked Knowledge Resource */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-455 uppercase flex items-center gap-1"><LinkIcon size={10} /> Link Vault Item</label>
                <select
                  value={selectedAsset.related_knowledge || ""}
                  onChange={(e) => handleLinkChange("related_knowledge", e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
                >
                  <option value="">No vault item linked</option>
                  {knowledge.map(k => (
                    <option key={k.id} value={k.id}>{k.title}</option>
                  ))}
                </select>
              </div>

              {/* Linked Task */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-455 uppercase flex items-center gap-1"><Check size={10} /> Link Task</label>
                <select
                  value={selectedAsset.related_task || ""}
                  onChange={(e) => handleLinkChange("related_task", e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
                >
                  <option value="">No task linked</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* Linked Calendar Event */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-455 uppercase flex items-center gap-1"><Clock size={10} /> Link Event</label>
                <select
                  value={selectedAsset.related_calendar_event || ""}
                  onChange={(e) => handleLinkChange("related_calendar_event", e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 font-medium cursor-pointer"
                >
                  <option value="">No event linked</option>
                  {calendarEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Asset specific audit history */}
            <div className="space-y-3.5 border-t border-zinc-200/40 dark:border-zinc-800 pt-4">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Activity History</span>
              {filteredActivities.length === 0 ? (
                <p className="text-[10px] text-zinc-400 italic">No activity timeline recorded.</p>
              ) : (
                <div className="space-y-3 pl-1 font-sans">
                  {filteredActivities.slice(0, 5).map((act, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-zinc-800 dark:text-zinc-200 font-bold leading-none">{act.action}</p>
                        <p className="text-[9px] text-zinc-400 mt-1 font-semibold">{new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Quick operations inside sidebar footer */}
          <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="h-8 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download size={11} className="text-zinc-400" />
                Large Preview
              </button>
              <button
                onClick={() => updateMutation.mutate({ slug: selectedAsset.slug, data: { archived: !selectedAsset.archived } })}
                className="h-8 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Archive size={11} className="text-zinc-400" />
                {selectedAsset.archived ? "Restore" : "Archive"}
              </button>
            </div>
            <button
              onClick={() => handleDeleteAsset(selectedAsset)}
              className="w-full h-8 rounded-lg border border-rose-500/10 hover:bg-rose-500/5 text-rose-500 font-bold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={11} />
              Delete Asset
            </button>
          </div>

        </div>
      )}

      {/* Bulk Operations sliding bottom panel */}
      {selectedSlugs.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-950 dark:bg-zinc-900 text-white rounded-2xl p-3 px-6 shadow-2xl flex items-center gap-6 z-35 animate-slideUp font-sans font-semibold text-xs border border-white/5">
          <span>{selectedSlugs.size} selected</span>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkFavorite}
              className="p-1.5 hover:bg-zinc-850 rounded flex items-center gap-1 hover:text-amber-450 cursor-pointer"
              title="Star / Unstar"
            >
              <Star size={13} className="fill-amber-500 text-amber-500" /> Favorite
            </button>
            <button
              onClick={handleBulkArchive}
              className="p-1.5 hover:bg-zinc-850 rounded flex items-center gap-1 hover:text-indigo-400 cursor-pointer"
              title="Archive Selected"
            >
              <Archive size={13} /> Archive
            </button>
            <button
              onClick={handleBulkRestore}
              className="p-1.5 hover:bg-zinc-850 rounded flex items-center gap-1 hover:text-indigo-400 cursor-pointer"
              title="Restore Selected"
            >
              <RotateCcw size={13} /> Restore
            </button>
            <button
              onClick={handleBulkDelete}
              className="p-1.5 hover:bg-zinc-850 rounded flex items-center gap-1 text-rose-455 hover:text-rose-500 cursor-pointer"
              title="Delete Selected"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
          <button
            onClick={() => setSelectedSlugs(new Set())}
            className="p-1.5 rounded hover:bg-zinc-850 font-bold cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modals & Dialog overlays */}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm mx-4 bg-white dark:bg-[#0e0e11] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-rose-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                  {confirmDelete.type === "bulk"
                    ? `Delete ${selectedSlugs.size} files?`
                    : `Delete "${confirmDelete.asset?.title}"?`}
                </h3>
                <p className="text-xs text-zinc-500">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setConfirmDelete(null); setDeleteError(null); }}
                disabled={deleteMutation.isPending || bulkDelMutation.isPending}
                className="flex-1 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "bulk") {
                    executeBulkDelete();
                  } else if (confirmDelete.asset) {
                    executeSingleDelete(confirmDelete.asset);
                  }
                }}
                disabled={deleteMutation.isPending || bulkDelMutation.isPending}
                className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {(deleteMutation.isPending || bulkDelMutation.isPending) ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                {(deleteMutation.isPending || bulkDelMutation.isPending) ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload dialog */}
      <MediaUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        queue={uploadQueue.queue}
        addFilesToQueue={uploadQueue.addFilesToQueue}
        cancelTask={uploadQueue.cancelTask}
        retryTask={uploadQueue.retryTask}
        clearCompleted={uploadQueue.clearCompleted}
      />

      {/* Large Details Preview overlay */}
      <MediaDetailsDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        asset={selectedAsset}
        projectSlug={projectSlug}
      />

      {/* Creation folder overlay dialog */}
      <AnimatePresence>
        {isCreateFolderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateFolderOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 z-10 font-sans font-semibold text-xs"
            >
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-3">Create New Folder</h3>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <input
                  type="text"
                  placeholder="Folder Name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 px-3 font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                  required
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="h-8 px-3 rounded-lg border hover:bg-zinc-50 text-[11px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-4 rounded-lg bg-indigo-650 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
