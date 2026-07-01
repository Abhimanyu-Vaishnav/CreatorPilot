"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Eye,
  FileEdit,
  Columns,
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
  onDuplicate?: () => void | Promise<void>;
}

export function SimpleEditor({
  note,
  onSave,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onClose,
  onDuplicate,
}: SimpleEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "editing" | "auto-updated">("saved");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("edit");
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
  }, [content, viewMode]); // Re-adjust on viewMode toggle since size might change

  // Inline markdown compiler
  const parseInlineMarkdown = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    let parts: (string | React.ReactNode)[] = [text];

    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return part;
      const split = part.split(boldRegex);
      return split.map((str, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold">{str}</strong> : str));
    });

    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return part;
      const split = part.split(italicRegex);
      return split.map((str, idx) => (idx % 2 === 1 ? <em key={idx} className="italic">{str}</em> : str));
    });

    return <>{parts}</>;
  };

  const compiledMarkdown = useMemo(() => {
    if (!content) {
      return <p className="text-zinc-400 dark:text-zinc-600 italic">No content. Start writing in Markdown...</p>;
    }

    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeLines: string[] = [];

    return (
      <div className="space-y-3 font-sans text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-none prose dark:prose-invert">
        {lines.map((line, idx) => {
          // Code block toggle
          if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
              inCodeBlock = false;
              const code = codeLines.join("\n");
              codeLines = [];
              return (
                <pre key={idx} className="bg-zinc-950 text-zinc-200 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 my-2">
                  <code>{code}</code>
                </pre>
              );
            } else {
              inCodeBlock = true;
              return null;
            }
          }

          if (inCodeBlock) {
            codeLines.push(line);
            return null;
          }

          // Headers
          if (line.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-2xl font-bold border-b border-zinc-100 dark:border-zinc-900 pb-1 mt-4 mb-2 text-zinc-950 dark:text-zinc-50">
                {line.substring(2)}
              </h1>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-xl font-bold mt-4 mb-2 text-zinc-900 dark:text-zinc-100">
                {line.substring(3)}
              </h2>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-lg font-bold mt-3 mb-1 text-zinc-900 dark:text-zinc-100">
                {line.substring(4)}
              </h3>
            );
          }

          // Checkbox checklists
          if (line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]")) {
            const checked = line.trim().startsWith("- [x]");
            const text = line.replace(/-\s*\[[ x]\]/, "").trim();
            return (
              <div key={idx} className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span className={`text-xs ${checked ? "line-through text-zinc-450 dark:text-zinc-550" : ""}`}>
                  {parseInlineMarkdown(text)}
                </span>
              </div>
            );
          }

          // Bullet lists
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            return (
              <li key={idx} className="list-disc list-inside pl-1 text-zinc-700 dark:text-zinc-300">
                {parseInlineMarkdown(line.trim().substring(2))}
              </li>
            );
          }

          // Blockquotes
          if (line.trim().startsWith("> ")) {
            return (
              <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1 italic bg-indigo-500/5 dark:bg-indigo-500/3 rounded-r text-zinc-500 my-2">
                {parseInlineMarkdown(line.trim().substring(2))}
              </blockquote>
            );
          }

          // Horizontal rule
          if (line.trim() === "---") {
            return <hr key={idx} className="border-zinc-200 dark:border-zinc-800 my-4" />;
          }

          // Empty line
          if (line.trim() === "") {
            return <div key={idx} className="h-2" />;
          }

          return (
            <p key={idx} className="text-zinc-700 dark:text-zinc-300">
              {parseInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  }, [content]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (title === note.title && content === note.content) {
      // Don't override if user manual save has set status to saved
      if (saveStatus !== "auto-updated" && saveStatus !== "saving") {
        setSaveStatus("saved");
      }
      return;
    }

    setSaveStatus("unsaved");
    const delayDebounceFn = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await onSave({ title, content });
        setSaveStatus("auto-updated");

        // Transition back to "saved" after 3 seconds
        const resetStatus = setTimeout(() => {
          setSaveStatus("saved");
        }, 3000);
        return () => clearTimeout(resetStatus);
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveStatus("unsaved");
      }
    }, 1000); // Trigger 1 second after typing stops

    return () => clearTimeout(delayDebounceFn);
  }, [title, content, note.title, note.content, onSave]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // 1. Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setSaveStatus("saving");
        try {
          await onSave({ title, content });
          setSaveStatus("saved");
        } catch (err) {
          console.error("Manual save failed:", err);
          setSaveStatus("unsaved");
        }
      }

      // 2. Ctrl + D (Duplicate)
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (onDuplicate) {
          onDuplicate();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, content, onSave, onDuplicate]);

  // Statistics
  const wordCount = useMemo(() => {
    const clean = content.trim();
    return clean ? clean.split(/\s+/).length : 0;
  }, [content]);

  const charCount = content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSaveStatus("editing");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus("editing");
  };

  return (
    <div
      className={`flex flex-col flex-1 bg-white dark:bg-[#070709] border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl shadow-sm transition-all duration-300 font-sans ${
        focusMode
          ? "fixed inset-0 z-50 p-6 md:p-12 overflow-y-auto"
          : "min-h-[600px] p-6"
      }`}
    >
      {/* Editor Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900/60 mb-6 gap-3">
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
            {saveStatus === "editing" && (
              <span className="text-zinc-500 uppercase tracking-wider">Editing...</span>
            )}
            {saveStatus === "saving" && (
              <>
                <Loader2 size={10} className="animate-spin text-indigo-500" />
                <span className="text-indigo-550 dark:text-indigo-400 uppercase tracking-wider">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={10} className="text-emerald-500" />
                <span className="text-emerald-555 dark:text-emerald-400 uppercase tracking-wider">Saved ✓</span>
              </>
            )}
            {saveStatus === "auto-updated" && (
              <>
                <Check size={10} className="text-emerald-500 animate-pulse" />
                <span className="text-emerald-500 uppercase tracking-wider">Auto-updated</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500 uppercase tracking-wider">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* View Mode controls & metadata actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Split Mode Selector */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/10 dark:border-zinc-800/60 mr-2 shadow-inner">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                viewMode === "edit"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-650 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-550 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-350"
              }`}
            >
              <FileEdit size={11} />
              Edit
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                viewMode === "preview"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-650 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-550 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-350"
              }`}
            >
              <Eye size={11} />
              Preview
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                viewMode === "split"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-650 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-550 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-350"
              }`}
            >
              <Columns size={11} />
              Split
            </button>
          </div>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              note.pinned
                ? "bg-indigo-50/80 border-indigo-200/30 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400"
                : "border-zinc-200/50 dark:border-zinc-800 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
            }`}
          >
            <Pin size={13} className={note.pinned ? "text-indigo-500 fill-indigo-500/10" : ""} />
            {note.pinned ? "Pinned" : "Pin"}
          </button>

          {/* Archive Note */}
          <button
            onClick={onToggleArchive}
            className={`h-8 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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

      {/* Editor & Preview Split Canvas */}
      <div className="flex-1 w-full mt-2">
        <div className="max-w-5xl mx-auto w-full">
          {/* Color stripe indicator */}
          <div className="h-1 rounded-full w-24 mb-4" style={{ backgroundColor: note.color }} />

          {/* Note Title (Always editable at top except in pure Preview mode) */}
          {viewMode !== "preview" ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="w-full bg-transparent border-none outline-none text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 placeholder-zinc-300 dark:placeholder-zinc-700 font-sans mb-1"
            />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-sans mb-1">
              {title || "Untitled Note"}
            </h1>
          )}

          <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider pb-3 border-b border-zinc-100 dark:border-zinc-900/40 mb-6">
            <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 px-2 py-0.5 rounded text-zinc-500">
              {note.template} Preset
            </span>
            <span>•</span>
            <span>Last modified: {new Date(note.updated_at).toLocaleDateString()}</span>
          </div>

          {/* Content Layout depending on View Mode */}
          {viewMode === "edit" && (
            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Start typing in Markdown..."
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed placeholder-zinc-400 dark:placeholder-zinc-650 font-mono focus:ring-0 min-h-[400px]"
            />
          )}

          {viewMode === "preview" && (
            <div className="min-h-[400px] border border-transparent select-text">
              {compiledMarkdown}
            </div>
          )}

          {viewMode === "split" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-200/60 dark:divide-zinc-850">
              {/* Left Column: Textarea Editor */}
              <div className="min-h-[400px] pb-6 md:pb-0">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Editor (Markdown)</span>
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Start typing in Markdown..."
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed placeholder-zinc-400 dark:placeholder-zinc-650 font-mono focus:ring-0 min-h-[380px]"
                />
              </div>

              {/* Right Column: HTML Compiled Preview */}
              <div className="min-h-[400px] pt-6 md:pt-0 md:pl-8 select-text">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Rendered Preview</span>
                {compiledMarkdown}
              </div>
            </div>
          )}
        </div>
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
