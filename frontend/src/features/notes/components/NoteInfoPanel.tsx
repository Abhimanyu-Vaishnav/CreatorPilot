"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Tag,
  Star,
  Pin,
  ChevronDown,
} from "lucide-react";
import { Note } from "../types";
import { Project } from "../../projects";

interface NoteInfoPanelProps {
  note: Note;
  project?: Project | null;
  onUpdateStatus: (status: "Draft" | "Published") => Promise<void>;
  onTogglePin?: () => void;
  onToggleFavorite?: () => void;
}

export function NoteInfoPanel({
  note,
  project,
  onUpdateStatus,
  onTogglePin,
  onToggleFavorite,
}: NoteInfoPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Format dates nicely
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusChange = async (newStatus: "Draft" | "Published") => {
    try {
      await onUpdateStatus(newStatus);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <aside className="w-full md:w-80 flex-shrink-0 bg-white dark:bg-[#0e0e11] border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-5 space-y-6 shadow-sm font-sans text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      <div>
        <h3 className="text-zinc-950 dark:text-zinc-50 font-bold text-sm flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-900/60">
          <Layers size={15} className="text-zinc-400" />
          Note Information
        </h3>
      </div>

      {/* Metadata Fields List */}
      <div className="space-y-4">
        {/* Project Context */}
        <div className="flex justify-between items-start">
          <span className="text-zinc-400 flex items-center gap-1.5 pt-0.5">
            <Tag size={12} /> Project
          </span>
          <span className="text-right truncate max-w-[150px] text-zinc-900 dark:text-zinc-100">
            {project ? (
              <Link
                href={`/dashboard/projects/${project.slug}`}
                className="hover:underline text-indigo-600 dark:text-indigo-400 font-bold"
              >
                {project.title}
              </Link>
            ) : (
              note.project_title || "General"
            )}
          </span>
        </div>

        {/* Status selection */}
        <div className="flex justify-between items-center relative">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Layers size={12} /> Status
          </span>
          <div>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] uppercase tracking-wider font-bold ${
                note.status === "Published"
                  ? "bg-indigo-50/80 border-indigo-200/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                  : "bg-zinc-100/50 border-zinc-200/30 text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400"
              }`}
            >
              {note.status || "Draft"}
              <ChevronDown size={11} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-30 font-semibold text-xs text-zinc-700 dark:text-zinc-300">
                <button
                  onClick={() => handleStatusChange("Draft")}
                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center justify-between"
                >
                  Draft
                  {note.status === "Draft" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </button>
                <button
                  onClick={() => handleStatusChange("Published")}
                  className="w-full px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-left flex items-center justify-between"
                >
                  Published
                  {note.status === "Published" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Word count */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <BookOpen size={12} /> Word Count
          </span>
          <span className="text-zinc-900 dark:text-zinc-100">{note.word_count} words</span>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <FileText size={12} /> Characters
          </span>
          <span className="text-zinc-900 dark:text-zinc-100">{note.content.length} chars</span>
        </div>

        {/* Reading Time */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Clock size={12} /> Reading Time
          </span>
          <span className="text-zinc-900 dark:text-zinc-100">{note.reading_time} min read</span>
        </div>

        {/* Slug Identifier */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <LinkIcon size={12} /> Slug Link
          </span>
          <code className="text-[10px] bg-zinc-50 dark:bg-zinc-900/40 px-1.5 py-0.5 rounded border border-zinc-200/20 text-zinc-650 dark:text-zinc-350 max-w-[120px] truncate">
            {note.slug}
          </code>
        </div>

        <hr className="border-zinc-100 dark:border-zinc-900" />

        {/* Created date */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Calendar size={11} /> Created
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
            {formatDate(note.created_at)}
          </span>
        </div>

        {/* Updated date */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Clock size={11} /> Updated
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
            {formatDate(note.updated_at)}
          </span>
        </div>

        {/* Last Opened date */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Clock size={11} /> Last Opened
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
            {formatDate(note.last_opened_at)}
          </span>
        </div>
      </div>

      {/* Pin / Star action controls */}
      {(onTogglePin || onToggleFavorite) && (
        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900/60">
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`flex-1 h-8 rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                note.favorite
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-500"
              }`}
            >
              <Star size={12} className={note.favorite ? "fill-amber-500 text-amber-500" : ""} />
              {note.favorite ? "Starred" : "Star"}
            </button>
          )}

          {onTogglePin && (
            <button
              onClick={onTogglePin}
              className={`flex-1 h-8 rounded-xl border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                note.pinned
                  ? "bg-indigo-50/80 border-indigo-200/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-500"
              }`}
            >
              <Pin size={12} className={note.pinned ? "text-indigo-500 fill-indigo-500/10" : ""} />
              {note.pinned ? "Pinned" : "Pin"}
            </button>
          )}
        </div>
      )}

      {/* Future AI Features Locked card */}
      <div className="relative p-4 rounded-xl border border-dashed border-indigo-500/20 dark:border-indigo-500/10 bg-indigo-500/5 overflow-hidden flex flex-col gap-2 shadow-inner">
        {/* Glow effect */}
        <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-xl" />
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
          <Sparkles size={14} className="animate-pulse" />
          AI Copilot Studio
        </div>
        <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
          Automatic summary, semantic indexing, writing adjustments, and prompt vault integration are locked. Under implementation in future development phases.
        </p>
      </div>
    </aside>
  );
}
