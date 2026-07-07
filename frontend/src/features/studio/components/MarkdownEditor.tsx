"use client";

import React, { useState, useEffect, useRef } from "react";
import { Document, UpdateDocumentInput } from "../types";
import { Eye, Edit3, Info, BookOpen } from "lucide-react";

interface MarkdownEditorProps {
  document: Document;
  onSave: (data: UpdateDocumentInput) => Promise<any>;
  onStatsChange?: (stats: { wordCount: number; charCount: number; readingTime: number }) => void;
}

export function MarkdownEditor({ document, onSave, onStatsChange }: MarkdownEditorProps) {
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [saveStatus, setSaveStatus] = useState<"editing" | "saving" | "saved">("saved");
  const [viewMode, setViewMode] = useState<"write" | "preview">("write");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef(true);

  // Sync state with selected document
  useEffect(() => {
    setTitle(document.title);
    setContent(document.content);
    setSaveStatus("saved");
    isFirstLoadRef.current = true;
  }, [document.id]);

  // Compute live statistics helper
  const computeStats = (text: string) => {
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, charCount, readingTime };
  };

  // Trigger statistics callback on type
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(computeStats(content));
    }
  }, [content, onStatsChange]);

  // Autosave handler
  useEffect(() => {
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    setSaveStatus("editing");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await onSave({ title, content });
        setSaveStatus("saved");
      } catch (error) {
        console.error("Autosave failed:", error);
        setSaveStatus("editing"); // Keep editing state on error
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [title, content]);

  // Custom Markdown parser
  const renderMarkdown = (md: string) => {
    if (!md) return '<p class="text-zinc-400 dark:text-zinc-600 italic text-xs">Nothing written yet...</p>';

    // Escape basic html to prevent raw injections
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```code```
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-100 dark:bg-zinc-900/60 p-4 rounded-xl font-mono text-[11px] overflow-x-auto my-3 border border-zinc-200/40 dark:border-zinc-800/80 leading-relaxed">$1</pre>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded font-mono text-[11px] text-rose-500 font-semibold">$1</code>');

    // Headings
    html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-6 mb-3 border-b border-zinc-200/50 dark:border-zinc-800/60 pb-1.5">$1</h1>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2 pb-1 border-b border-zinc-100/50 dark:border-zinc-900/40">$1</h2>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-sm font-bold text-zinc-850 dark:text-zinc-200 mt-4 mb-2">$1</h3>');

    // Blockquotes: > text
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-indigo-500/80 pl-4 py-1.5 my-3 text-zinc-650 dark:text-zinc-400 italic bg-indigo-50/10 dark:bg-[#6366f1]/5 pr-3 rounded-r-lg">$1</blockquote>');

    // Unordered lists
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="list-disc ml-5 my-1 text-xs text-zinc-700 dark:text-zinc-350">$1</li>');

    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-5 my-1 text-xs text-zinc-700 dark:text-zinc-350">$1</li>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

    // Links: [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">$1</a>');

    // Wrap double newlines or blocks
    const lines = html.split("\n");
    let inList = false;
    let parsed = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("<li")) {
        if (!inList) {
          parsed += '<ul class="space-y-1.5 my-3 font-sans">';
          inList = true;
        }
        parsed += lines[i] + "\n";
      } else {
        if (inList) {
          parsed += "</ul>\n";
          inList = false;
        }

        if (line === "") {
          parsed += "\n";
        } else if (
          line.startsWith("<h") ||
          line.startsWith("<pre") ||
          line.startsWith("<blockquote") ||
          line.startsWith("<code")
        ) {
          parsed += lines[i] + "\n";
        } else {
          parsed += `<p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed my-3 font-sans">${lines[i]}</p>\n`;
        }
      }
    }

    if (inList) {
      parsed += "</ul>\n";
    }

    return parsed;
  };

  const currentStats = computeStats(content);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0e0e11] rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Editor Top Bar */}
      <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("write")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "write"
                ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Edit3 size={13} />
            Write
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === "preview"
                ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Eye size={13} />
            Preview
          </button>
        </div>

        {/* Autosave Status */}
        <div className="flex items-center gap-2">
          {saveStatus === "editing" && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold animate-pulse">
              Editing...
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              Saved ✓
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-3xl flex flex-col space-y-4">
          {viewMode === "write" ? (
            <>
              {/* Document Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Document"
                className="w-full text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 focus:outline-none border-b border-transparent focus:border-zinc-200/50 dark:focus:border-zinc-800/80 pb-2 transition-all"
              />

              {/* Distraction-Free Textarea Editor */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing in Markdown...
Use markdown syntax:
# Header 1
## Header 2
**bold**
*italics*
- list item
> blockquote
`code`
```code block```"
                className="w-full flex-1 min-h-[400px] resize-none focus:outline-none text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans placeholder-zinc-400 dark:placeholder-zinc-600 bg-transparent"
              />
            </>
          ) : (
            <div className="w-full space-y-4 font-sans select-text">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/80">
                {title || "Untitled Document"}
              </h1>
              <div
                className="prose dark:prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Editor Micro-footer with Stats summary */}
      <div className="h-8 border-t border-zinc-250/20 dark:border-zinc-900/60 px-4 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-950/25 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
        <div className="flex items-center gap-3">
          <span>{currentStats.wordCount} words</span>
          <span>•</span>
          <span>{currentStats.charCount} characters</span>
          <span>•</span>
          <span className="flex items-center gap-1"><BookOpen size={10} /> {currentStats.readingTime} min read</span>
        </div>
        <div className="flex items-center gap-1">
          <Info size={10} />
          <span>Markdown Supported</span>
        </div>
      </div>
    </div>
  );
}
