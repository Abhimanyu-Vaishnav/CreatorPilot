"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Database,
  Search,
  Plus,
  SlidersHorizontal,
  Grid,
  List,
  Star,
  Pin,
  Archive,
  Loader2,
  Tag,
  X,
  FileText,
  Globe,
  FileDown,
  Image as ImageIcon,
  Video,
  BookOpen,
  Compass,
  CheckSquare,
  Code2,
  File,
  AlertCircle,
} from "lucide-react";
import {
  useProjectKnowledgeQuery,
  useCreateKnowledgeMutation,
  useUpdateKnowledgeMutation,
  useDeleteKnowledgeMutation,
} from "../hooks/useVault";
import { KnowledgeItem, KnowledgeType } from "../types";
import { KnowledgeCard } from "./KnowledgeCard";
import { KnowledgeItemDialog } from "./KnowledgeItemDialog";
import { useProjectNotesQuery } from "../../notes/hooks/useNotes";
import { ConfirmationDialog } from "../../notes/components/ConfirmationDialog";

interface KnowledgeWorkspaceProps {
  projectSlug: string;
  projectId: number;
}

export function getKnowledgeTypeIcon(type: string) {
  switch (type) {
    case "Research Note":
      return FileText;
    case "Website":
      return Globe;
    case "PDF":
      return FileDown;
    case "Image":
      return ImageIcon;
    case "Video Link":
      return Video;
    case "Book":
      return BookOpen;
    case "Tutorial":
      return Compass;
    case "Checklist":
      return CheckSquare;
    case "Snippet":
      return Code2;
    default:
      return File;
  }
}

export function KnowledgeWorkspace({ projectSlug, projectId }: KnowledgeWorkspaceProps) {
  // UI & Layout state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<KnowledgeType | "">("");
  const [showStarred, setShowStarred] = useState<boolean | undefined>(undefined);
  const [showPinned, setShowPinned] = useState<boolean | undefined>(undefined);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [ordering, setOrdering] = useState("-pinned,-favorite,-updated_at");

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  // React Query hook triggers
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useProjectKnowledgeQuery(projectSlug, {
    archived: showArchived,
    favorite: showStarred,
    pinned: showPinned,
    type: selectedType,
    search: search || undefined,
    ordering: ordering,
  });

  const { data: projectNotes = [] } = useProjectNotesQuery(projectSlug);

  const createMutation = useCreateKnowledgeMutation(projectSlug);
  const updateMutation = useUpdateKnowledgeMutation(projectSlug);
  const deleteMutation = useDeleteKnowledgeMutation(projectSlug);

  const handleCreateSubmit = async (payload: any) => {
    await createMutation.mutateAsync({
      ...payload,
      project: projectId,
    });
    setIsCreateOpen(false);
  };

  const handleEditSubmit = async (payload: any) => {
    if (editingItem) {
      await updateMutation.mutateAsync({
        slug: editingItem.slug,
        data: payload,
      });
      setEditingItem(null);
    }
  };

  const handleToggleFavorite = async (slug: string, favorite: boolean) => {
    await updateMutation.mutateAsync({
      slug,
      data: { favorite },
    });
  };

  const handleTogglePin = async (slug: string, pinned: boolean) => {
    await updateMutation.mutateAsync({
      slug,
      data: { pinned },
    });
  };

  const handleToggleArchive = async (slug: string, archived: boolean) => {
    await updateMutation.mutateAsync({
      slug,
      data: { archived },
    });
  };

  const handleDeleteConfirm = async () => {
    if (deletingSlug) {
      await deleteMutation.mutateAsync(deletingSlug);
      setDeletingSlug(null);
    }
  };

  // Compile list of all unique tags present in current unarchived items for filters
  const allUniqueTags = Array.from(
    new Set(
      items
        .filter((item) => !item.archived)
        .flatMap((item) => item.tags || [])
    )
  );

  // Client-side tag filtering (as backend filter is text contains)
  const filteredItems = selectedTag
    ? items.filter((item) => item.tags && item.tags.includes(selectedTag))
    : items;

  const handleClearFilters = () => {
    setSearch("");
    setSelectedType("");
    setShowStarred(undefined);
    setShowPinned(undefined);
    setSelectedTag(null);
    setShowArchived(false);
    setOrdering("-pinned,-favorite,-updated_at");
  };

  const hasActiveFilters =
    search !== "" ||
    selectedType !== "" ||
    showStarred !== undefined ||
    showPinned !== undefined ||
    selectedTag !== null ||
    showArchived !== false;

  return (
    <div className="space-y-5">
      {/* Action and Filter Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Search and Main Filter Toggle */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
            <input
              type="text"
              placeholder="Search resources, tags or URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] pl-9 pr-4 text-xs font-semibold focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
              showFilters || hasActiveFilters
                ? "border-indigo-650 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        </div>

        {/* Right Side: Visual Toggles and primary CTA */}
        <div className="flex items-center gap-3 self-end md:self-auto font-semibold">
          {/* Sorting */}
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] px-3 text-xs focus:outline-none dark:text-zinc-50"
          >
            <option value="-pinned,-favorite,-updated_at">Order: Default</option>
            <option value="title">Order: A–Z</option>
            <option value="-title">Order: Z–A</option>
            <option value="-created_at">Order: Newest</option>
            <option value="created_at">Order: Oldest</option>
            <option value="-updated_at">Order: Recently Updated</option>
            <option value="-last_opened_at">Order: Recently Opened</option>
          </select>

          {/* Grid/List View Toggles */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden p-0.5 bg-zinc-50 dark:bg-zinc-900/50 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Grid size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/40"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <List size={13} />
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all"
          >
            <Plus size={14} />
            Add Resource
          </button>
        </div>
      </div>

      {/* Expanded filters row */}
      {(showFilters || hasActiveFilters) && (
        <div className="p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/20 dark:bg-[#0c0c0f]/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-slideDown font-semibold text-zinc-600 dark:text-zinc-400 text-xs">
          
          {/* Starred / Pinned Select */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Status Settings</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowStarred(showStarred === true ? undefined : true)}
                className={`flex-1 h-8 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-[10px] ${
                  showStarred === true
                    ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11]"
                }`}
              >
                <Star size={11} className={showStarred === true ? "fill-amber-500" : ""} />
                Starred Only
              </button>
              <button
                onClick={() => setShowPinned(showPinned === true ? undefined : true)}
                className={`flex-1 h-8 px-2 rounded-xl border flex items-center justify-center gap-1.5 text-[10px] ${
                  showPinned === true
                    ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11]"
                }`}
              >
                <Pin size={11} className={showPinned === true ? "fill-indigo-500" : ""} />
                Pinned Only
              </button>
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Resource Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as KnowledgeType | "")}
              className="w-full h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] px-2 text-[11px] focus:outline-none dark:text-zinc-50 mt-1"
            >
              <option value="">All Types</option>
              <option value="Research Note">Research Notes</option>
              <option value="Website">Websites</option>
              <option value="PDF">PDF Documents</option>
              <option value="Image">Images</option>
              <option value="Video Link">Video Links</option>
              <option value="Book">Books</option>
              <option value="Tutorial">Tutorials</option>
              <option value="Checklist">Checklists</option>
              <option value="Snippet">Snippets</option>
              <option value="Document">Documents</option>
            </select>
          </div>

          {/* Archive Status Toggle */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Archive Status</label>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`w-full h-8 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] mt-1 ${
                showArchived
                  ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11]"
              }`}
            >
              <Archive size={11} />
              {showArchived ? "Showing Archived" : "Show Archived"}
            </button>
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="w-full h-8 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-center gap-1 text-[11px] disabled:opacity-50"
            >
              Clear Active Filters
            </button>
          </div>

        </div>
      )}

      {/* Tags Quick Filters Row */}
      {allUniqueTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 select-none font-semibold text-xs text-zinc-500">
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-450 tracking-wider flex-shrink-0 mr-1">
            <Tag size={11} />
            Quick Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-[10px] border flex-shrink-0 transition-all ${
              selectedTag === null
                ? "bg-zinc-950 border-zinc-950 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-950"
                : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            All tags
          </button>
          {allUniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-3 py-1 rounded-full text-[10px] border flex-shrink-0 transition-all ${
                tag === selectedTag
                  ? "bg-indigo-650 border-indigo-650 text-white dark:bg-indigo-400 dark:border-indigo-400 dark:text-zinc-950"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-xs text-zinc-500 font-semibold">Retrieving Knowledge Vault items...</p>
        </div>
      ) : isError ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Vault Error:</span>{" "}
            {error instanceof Error ? error.message : "Failed to load knowledge vault."}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/20 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4 shadow-sm py-16 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Database size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {hasActiveFilters ? "No matching resources found" : "Your Knowledge Vault"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-sm mx-auto mt-1.5 leading-relaxed font-semibold">
              {hasActiveFilters
                ? "Try clearing tags, statuses or search query terms to find linked assets."
                : "The Knowledge Vault stores external references, URLs, PDFs, checklists, and snippets. Use this library to link research materials directly to writing drafts."}
            </p>
          </div>
          <button
            onClick={() => {
              if (hasActiveFilters) {
                handleClearFilters();
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="h-10 px-5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            {hasActiveFilters ? (
              "Clear Search Filters"
            ) : (
              <>
                <Plus size={14} />
                Add First Resource
              </>
            )}
          </button>
        </div>
      ) : (
        /* Display items in Grid or List layout */
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "space-y-3.5"
          }
        >
          {filteredItems.map((item) => {
            if (viewMode === "grid") {
              return (
                <KnowledgeCard
                  key={item.id}
                  item={item}
                  projectSlug={projectSlug}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                  onToggleArchive={handleToggleArchive}
                  onDelete={async (slug) => setDeletingSlug(slug)}
                  onEdit={(item) => setEditingItem(item)}
                />
              );
            }

            // List layout rendering
            const TypeIcon = getKnowledgeTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="group p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/20 hover:shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs font-semibold"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                    <TypeIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${projectSlug}/knowledge/${item.slug}`}
                        className="font-bold text-xs text-zinc-900 dark:text-zinc-50 hover:text-indigo-650 truncate"
                      >
                        {item.title}
                      </Link>
                      {item.pinned && <Pin size={10} className="text-indigo-600 fill-indigo-500/10 flex-shrink-0" />}
                      {item.favorite && <Star size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium truncate max-w-lg">
                      {item.description || "No description provided."}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 justify-between sm:justify-end">
                  {/* Linked status tag */}
                  {item.note_reference && (
                    <span className="px-2 py-0.5 rounded bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-200/10">
                      Linked
                    </span>
                  )}
                  {/* Tags */}
                  <div className="hidden md:flex items-center gap-1">
                    {item.tags && item.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-200/10 text-[9px] font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleFavorite(item.slug, !item.favorite)}
                      className={`p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.favorite ? "text-amber-500" : "text-zinc-400"
                      }`}
                      title={item.favorite ? "Unstar" : "Star"}
                    >
                      <Star size={12} className={item.favorite ? "fill-amber-500" : ""} />
                    </button>
                    <button
                      onClick={() => handleTogglePin(item.slug, !item.pinned)}
                      className={`p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                        item.pinned ? "text-indigo-600" : "text-zinc-400"
                      }`}
                      title={item.pinned ? "Unpin" : "Pin"}
                    >
                      <Pin size={12} className={item.pinned ? "fill-indigo-500/10" : ""} />
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingSlug(item.slug)}
                      className="p-1.5 rounded hover:bg-rose-500/5 text-zinc-450 hover:text-rose-500"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog for Creating Resources */}
      <KnowledgeItemDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
        notes={projectNotes}
      />

      {/* Dialog for Editing Resources */}
      <KnowledgeItemDialog
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSubmit={handleEditSubmit}
        loading={updateMutation.isPending}
        item={editingItem}
        notes={projectNotes}
      />

      {/* Dialog for Deleting Resources */}
      <ConfirmationDialog
        isOpen={deletingSlug !== null}
        onClose={() => setDeletingSlug(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Knowledge Resource"
        description="Are you sure you want to delete this resource? This will remove the reference entry from your project space permanently. This action cannot be undone."
        confirmText="Delete permanently"
        cancelText="Cancel"
        type="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
