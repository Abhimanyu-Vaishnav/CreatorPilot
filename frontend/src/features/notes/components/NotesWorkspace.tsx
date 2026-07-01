"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Grid,
  List,
  Star,
  Pin,
  Archive,
  Trash2,
  Copy,
  MoreVertical,
  Plus,
  FileText,
  Clock,
  BookOpen,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  useProjectNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} from "../hooks/useNotes";
import { Note } from "../types";
import { NoteDialog } from "./NoteDialog";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface NotesWorkspaceProps {
  projectSlug: string;
  projectId: number;
}

export function NotesWorkspace({ projectSlug, projectId }: NotesWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPinned, setFilterPinned] = useState(false);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<"updated" | "opened" | "created" | "title">("updated");

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Reusable Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    type: "danger" | "warning" | "info";
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    cancelText: "",
    type: "warning",
    onConfirm: () => {},
  });

  // API Queries & Mutations
  const { data: notes = [], isLoading } = useProjectNotesQuery(projectSlug);
  const createMutation = useCreateNoteMutation();
  const updateMutation = useUpdateNoteMutation();
  const deleteMutation = useDeleteNoteMutation(projectSlug);

  // Close card menu helper
  const toggleMenu = (e: React.MouseEvent, noteId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(activeMenuId === noteId ? null : noteId);
  };

  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Quick Action Handlers
  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await updateMutation.mutateAsync({
      slug: note.slug,
      data: { pinned: !note.pinned },
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await updateMutation.mutateAsync({
      slug: note.slug,
      data: { favorite: !note.favorite },
    });
  };

  const handleToggleArchive = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: note.archived ? "Restore Note" : "Archive Note",
      description: note.archived 
        ? `Restore note "${note.title}" back to active workspace?`
        : `Are you sure you want to archive note "${note.title}"?`,
      confirmText: note.archived ? "Restore" : "Archive",
      cancelText: "Cancel",
      type: "info",
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          slug: note.slug,
          data: { archived: !note.archived },
        });
      }
    });
  };

  const handleDelete = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Delete Note",
      description: `Are you sure you want to permanently delete note "${note.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(note.slug);
      }
    });
  };

  const handleDuplicate = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: "Duplicate Note",
      description: `Create a copy of note "${note.title}" in this workspace?`,
      confirmText: "Duplicate",
      cancelText: "Cancel",
      type: "info",
      onConfirm: async () => {
        await createMutation.mutateAsync({
          project: projectId,
          title: `${note.title} (Copy)`,
          content: note.content,
          template: note.template,
          color: note.color,
          pinned: note.pinned,
          favorite: note.favorite,
          status: note.status,
        });
      }
    });
  };

  const handleCreateSubmit = async (formData: any) => {
    await createMutation.mutateAsync({
      project: projectId,
      ...formData,
    });
  };

  // Filter & Search & Sort logic (applied client-side for ultra-fast Notion feel)
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by Archive state
    result = result.filter((n) => n.archived === showArchived);

    // Filter by Pinned
    if (filterPinned) {
      result = result.filter((n) => n.pinned);
    }

    // Filter by Favorite
    if (filterFavorite) {
      result = result.filter((n) => n.favorite);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.slug.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned notes are always boosted first
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "created") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "opened") {
        const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
        const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
        return bTime - aTime;
      }
      // default: updated (newest edits first)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return result;
  }, [notes, showArchived, filterPinned, filterFavorite, searchQuery, sortBy]);

  return (
    <div className="space-y-4 font-sans text-zinc-800 dark:text-zinc-200">
      {/* Top Filter and Search Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#0c0c0f] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note title or content..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
          />
        </div>

        {/* Filters and sorting */}
        <div className="flex flex-wrap items-center gap-2 font-semibold">
          {/* Favorites Filter */}
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`h-9 px-3.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              filterFavorite
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Star size={12} className={filterFavorite ? "fill-amber-500 text-amber-500" : ""} />
            Starred
          </button>

          {/* Pinned Filter */}
          <button
            onClick={() => setFilterPinned(!filterPinned)}
            className={`h-9 px-3.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              filterPinned
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Pin size={12} className={filterPinned ? "text-indigo-500" : ""} />
            Pinned
          </button>

          {/* Archive toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`h-9 px-3.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
              showArchived
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                : "border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <Archive size={12} />
            {showArchived ? "Archived" : "Active Notes"}
          </button>

          {/* Sort Selector */}
          <div className="relative flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl px-2.5 h-9">
            <ArrowUpDown size={12} className="text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 outline-none text-xs font-semibold text-zinc-600 dark:text-zinc-400 pr-1 cursor-pointer"
            >
              <option value="updated">Recently Edited</option>
              <option value="opened">Recently Opened</option>
              <option value="created">Newest Created</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Grid/List View switch */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200/20 dark:border-zinc-800/50 shadow-inner">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <List size={14} />
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
          >
            <Plus size={14} />
            New Note
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
          <p className="text-xs text-zinc-500 font-semibold">Scanning notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f]/20 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 py-16 animate-fadeIn shadow-sm">
          {/* Custom SVG Illustration */}
          <div className="relative w-16 h-16 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shadow-inner">
            <svg className="w-8 h-8 text-indigo-505 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping opacity-60" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 font-sans">Notes Workspace Empty</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed font-semibold">
              {searchQuery
                ? "No drafts matched your search query. Try broadening your keywords."
                : showArchived
                ? "Your archived workspace is empty."
                : "Create outline drafts, meeting agendas, YouTube outlines, or SEO structures. Notes are the workspace core."}
            </p>
          </div>
          {!searchQuery && !showArchived && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Plus size={14} />
              Create First Note
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isMenuOpen = activeMenuId === note.id;
            const updatedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={note.id}
                className="group relative rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col min-h-[160px]"
              >
                {/* Visual Color Accenting strip */}
                <div className="h-1.5 w-full" style={{ backgroundColor: note.color || "#6366f1" }} />

                <Link
                  href={`/dashboard/projects/${projectSlug}/notes/${note.slug}`}
                  className="p-5 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {note.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {note.pinned && (
                          <Pin size={11} className="text-indigo-500 fill-indigo-500/10" />
                        )}
                        {note.favorite && (
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-3 font-medium">
                      {note.excerpt || "No description. Tap to open and start drafting..."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/60 pt-3 mt-4 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide text-zinc-550">
                        {note.template}
                      </span>
                      {note.archived ? (
                        <span className="bg-rose-500/15 border border-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                          Archived
                        </span>
                      ) : note.status === "Published" ? (
                        <span className="bg-indigo-50/80 border border-indigo-200/30 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-bold">
                          Published
                        </span>
                      ) : (
                        <span className="bg-zinc-150/40 border border-zinc-200/20 text-zinc-550 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-bold">
                          Draft
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 ml-1">
                        <BookOpen size={10} />
                        {note.word_count} w
                      </span>
                    </div>

                    <span className="flex items-center gap-1 font-semibold">
                      <Clock size={10} />
                      {updatedDate}
                    </span>
                  </div>
                </Link>

                {/* More Action Button */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => toggleMenu(e, note.id)}
                    className="p-1 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800 shadow-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    <MoreVertical size={13} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-xl py-1 z-20 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <button
                        onClick={(e) => handleTogglePin(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Pin size={12} />
                        {note.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Star size={12} />
                        {note.favorite ? "Unstar" : "Star"}
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Copy size={12} />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => handleToggleArchive(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Archive size={12} />
                        {note.archived ? "Restore" : "Archive"}
                      </button>
                      <hr className="my-1 border-zinc-100 dark:border-zinc-900" />
                      <button
                        onClick={(e) => handleDelete(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-500 text-left flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="p-4 bg-white dark:bg-[#0e0e11] rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-900/60">
          {filteredNotes.map((note) => {
            const isMenuOpen = activeMenuId === note.id;
            const updatedDate = new Date(note.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={note.id}
                className="group relative flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors px-1"
              >
                <Link
                  href={`/dashboard/projects/${projectSlug}/notes/${note.slug}`}
                  className="flex items-center gap-4 flex-1 min-w-0 pr-12"
                >
                  {/* Left Color Indicator Circle */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: note.color }}
                  />

                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate max-w-[200px]">
                        {note.title}
                      </span>
                      {note.pinned && <Pin size={10} className="text-indigo-500" />}
                      {note.favorite && <Star size={10} className="text-amber-500 fill-amber-500" />}
                    </div>

                    <span className="text-[10px] text-zinc-400 dark:text-zinc-550 truncate max-w-xs font-semibold sm:pl-4">
                      {note.excerpt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 flex-shrink-0 font-semibold pl-4">
                    <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide text-zinc-550">
                      {note.template}
                    </span>
                    {note.archived ? (
                      <span className="bg-rose-500/15 border border-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide">
                        Archived
                      </span>
                    ) : note.status === "Published" ? (
                      <span className="bg-indigo-50/80 border border-indigo-200/30 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold">
                        Published
                      </span>
                    ) : (
                      <span className="bg-zinc-150/40 border border-zinc-200/20 text-zinc-550 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold">
                        Draft
                      </span>
                    )}
                    <span>{note.word_count} w</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {updatedDate}
                    </span>
                  </div>
                </Link>

                {/* More Action Button */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1.5">
                  <button
                    onClick={(e) => toggleMenu(e, note.id)}
                    className="p-1 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800 shadow-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    <MoreVertical size={13} />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-xl py-1 z-20 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <button
                        onClick={(e) => handleTogglePin(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Pin size={12} />
                        {note.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Star size={12} />
                        {note.favorite ? "Unstar" : "Star"}
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Copy size={12} />
                        Duplicate
                      </button>
                      <button
                        onClick={(e) => handleToggleArchive(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center gap-2"
                      >
                        <Archive size={12} />
                        {note.archived ? "Restore" : "Archive"}
                      </button>
                      <hr className="my-1 border-zinc-100 dark:border-zinc-900" />
                      <button
                        onClick={(e) => handleDelete(e, note)}
                        className="w-full px-3 py-1.5 hover:bg-rose-500/10 text-rose-500 text-left flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Creation Dialog */}
      <NoteDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
      />

      {/* Consolidated Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />
    </div>
  );
}
