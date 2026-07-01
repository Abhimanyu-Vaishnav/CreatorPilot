"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  Pin,
  Archive,
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
  Check,
  Clock,
  BookOpen,
} from "lucide-react";

interface SimpleEditorProps {
  note: {
    id: number;
    title: string;
    content: string;
    slug: string;
    favorite: boolean;
    pinned: boolean;
    archived: boolean;
    color: string;
    template: string;
    updated_at: string;
  };
  onSave: (data: { title: string; content: string }) => Promise<void>;
  onToggleFavorite: () => Promise<void>;
  onTogglePin: () => Promise<void>;
  onToggleArchive: () => Promise<void>;
  onClose: () => void;
}

export function SimpleEditor({
  note,
  onSave,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onClose,
}: SimpleEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [focusMode, setFocusMode] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sync inputs with prop updates (e.g. if updated elsewhere)
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.title, note.content]);

  // Handle auto-resizing content textarea
  const adjustHeight = () => {
    const textarea = contentRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  // Debounced Autosave Logic
  useEffect(() => {
    if (title === note.title && content === note.content) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("unsaved");
    const delayDebounceFn = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await onSave({ title, content });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("unsaved");
      }
    }, 1000); // Trigger save 1 second after typing stops

    return () => clearTimeout(delayDebounceFn);
  }, [title, content, note.title, note.content, onSave]);

  // Statistics
  const wordCount = useMemo(() => {
    const clean = content.trim();
    return clean ? clean.split(/\s+/).length : 0;
  }, [content]);

  const charCount = content.length;

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  function useMemo<T>(fn: () => T, deps: any[]): T {
    return React.useMemo(fn, deps);
  }

  return (
    <div
      className={`flex flex-col flex-1 bg-white dark:bg-[#070709] border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all duration-300 font-sans ${
        focusMode
          ? "fixed inset-0 z-50 p-6 md:p-12 overflow-y-auto"
          : "min-h-[600px] p-6"
      }`}
    >
      {/* Editor Control Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900/60 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-zinc-200/50 dark:border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            title="Back to notes list"
          >
            <ArrowLeft size={14} />
          </button>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={10} className="animate-spin text-indigo-500" />
                <span className="text-indigo-500 uppercase tracking-wider">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={10} className="text-emerald-500" />
                <span className="text-emerald-500 uppercase tracking-wider">Autosaved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500 uppercase tracking-wider">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Note Action Actions */}
        <div className="flex items-center gap-2">
          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              focusMode
                ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                : "border-zinc-200/50 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            Focus Mode
          </button>

          {/* Star Note */}
          <button
            onClick={onToggleFavorite}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              note.favorite
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "border-zinc-200/50 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Star size={13} className={note.favorite ? "fill-amber-500 text-amber-500" : ""} />
            {note.favorite ? "Starred" : "Star"}
          </button>

          {/* Pin Note */}
          <button
            onClick={onTogglePin}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              note.pinned
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                : "border-zinc-200/50 dark:border-zinc-800 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
            }`}
          >
            <Pin size={13} className={note.pinned ? "text-indigo-500" : ""} />
            {note.pinned ? "Pinned" : "Pin"}
          </button>

          {/* Archive Note */}
          <button
            onClick={onToggleArchive}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              note.archived
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                : "border-zinc-200/50 dark:border-zinc-800 text-zinc-500 hover:text-rose-500 dark:hover:text-zinc-350"
            }`}
          >
            <Archive size={13} />
            {note.archived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      {/* Editor Drafting Canvas */}
      <div className="flex-1 max-w-3xl mx-auto w-full space-y-4">
        {/* Color stripe info inside focus mode */}
        {focusMode && (
          <div className="h-1 rounded-full w-24 mb-4" style={{ backgroundColor: note.color }} />
        )}

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full bg-transparent border-none outline-none text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 placeholder-zinc-300 dark:placeholder-zinc-750 font-sans"
        />

        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-900/40">
          <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 px-2 py-0.5 rounded text-zinc-500">
            {note.template} Preset
          </span>
          <span>•</span>
          <span>Last modified: {new Date(note.updated_at).toLocaleDateString()}</span>
        </div>

        {/* Content Textarea */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing in markdown..."
          className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed placeholder-zinc-400 dark:placeholder-zinc-600 font-mono mt-4 focus:ring-0 min-h-[300px]"
        />
      </div>

      {/* Footer Metrics Panel */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/60 pt-4 mt-6 text-[10px] text-zinc-400 dark:text-zinc-550 font-bold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-semibold">
            <BookOpen size={11} />
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span>•</span>
          <span>{charCount} {charCount === 1 ? "character" : "characters"}</span>
        </div>

        <div className="flex items-center gap-1 font-semibold">
          <Clock size={11} />
          <span>{readingTime} {readingTime === 1 ? "min" : "mins"} read</span>
        </div>
      </div>
    </div>
  );
}
