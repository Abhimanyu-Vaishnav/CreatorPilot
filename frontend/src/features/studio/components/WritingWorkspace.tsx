"use client";

import React, { useState, useRef } from "react";
import {
  useProjectDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} from "../hooks/useDocuments";
import { Document, CreateDocumentInput } from "../types";
import { MarkdownEditor } from "./MarkdownEditor";
import { useProjectNotesQuery } from "../../notes";
import { useProjectKnowledgeQuery } from "../../vault";
import { useProjectTasksQuery } from "../../tasks";
import { useCalendarEventsQuery } from "../../planner";
import { useProjectMediaQuery, MediaDetailsDialog } from "../../media";
import {
  FileText,
  Plus,
  BookOpen,
  FolderOpen,
  Layers,
  FileSignature,
  Trash2,
  Copy,
  ChevronRight,
  ExternalLink,
  Tag,
  CheckSquare,
  Calendar,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  X,
  PlusCircle,
  Archive,
  RotateCcw,
  Image,
} from "lucide-react";
import { DeleteConfirmationDialog } from "../../projects";

interface WritingWorkspaceProps {
  projectSlug: string;
  projectId: number;
}

export function WritingWorkspace({ projectSlug, projectId }: WritingWorkspaceProps) {
  const [activeDocSlug, setActiveDocSlug] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"outline" | "notes" | "knowledge" | "media">("outline");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [isMediaDetailsOpen, setIsMediaDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  // Queries
  const { data: documents = [], isLoading: docsLoading } = useProjectDocumentsQuery(projectSlug);
  const { data: notes = [] } = useProjectNotesQuery(projectSlug);
  const { data: knowledge = [] } = useProjectKnowledgeQuery(projectSlug);
  const { data: tasks = [] } = useProjectTasksQuery(projectSlug);
  const { data: calendarEvents = [] } = useCalendarEventsQuery({ project: projectId.toString() });
  const { data: mediaAssets = [] } = useProjectMediaQuery(projectSlug, { archived: false });

  // Mutations
  const createMutation = useCreateDocumentMutation();
  const updateMutation = useUpdateDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation(projectSlug);

  const activeDocs = documents.filter((doc) => !doc.archived);
  const activeDoc = activeDocs.find((doc) => doc.slug === activeDocSlug);

  // Handle document creation
  const handleCreateDocument = async (templateName: string) => {
    const defaultTitles: Record<string, string> = {
      "Blog Article": "Untitled Blog Article",
      "YouTube Script": "Untitled YouTube Script",
      "Pinterest Pin Copy": "Untitled Pinterest Pins",
      Newsletter: "Untitled Newsletter",
      "Course Outline": "Untitled Course Outline",
      "Podcast Outline": "Untitled Podcast Episode",
      Blank: "Untitled Document",
    };

    const title = defaultTitles[templateName] || "Untitled Document";

    const data: CreateDocumentInput = {
      project: projectId,
      title,
      template: templateName,
      status: "Draft",
      visibility: "Private",
    };

    try {
      const newDoc = await createMutation.mutateAsync(data);
      setActiveDocSlug(newDoc.slug);
      setShowTemplateSelector(false);
    } catch (err) {
      console.error("Failed to create document", err);
    }
  };

  // Handle document saving (debounced callback)
  const handleSaveDocument = async (data: { title?: string; content?: string }) => {
    if (!activeDocSlug) return;
    return updateMutation.mutateAsync({
      slug: activeDocSlug,
      data,
    });
  };

  // Handle duplicate document
  const handleDuplicate = async (doc: Document) => {
    try {
      const data: CreateDocumentInput = {
        project: projectId,
        title: `${doc.title} (Copy)`,
        content: doc.content,
        template: doc.template,
        status: "Draft",
        visibility: doc.visibility,
      };
      const newDoc = await createMutation.mutateAsync(data);
      setActiveDocSlug(newDoc.slug);
    } catch (err) {
      console.error("Failed to duplicate document", err);
    }
  };

  // Handle archive document
  const handleArchive = async (doc: Document) => {
    try {
      await updateMutation.mutateAsync({
        slug: doc.slug,
        data: { archived: !doc.archived },
      });
      if (activeDocSlug === doc.slug) {
        setActiveDocSlug(null);
      }
    } catch (err) {
      console.error("Failed to archive document", err);
    }
  };

  // Parse markdown headings for live outline
  const parseHeadings = (text: string) => {
    if (!text) return [];
    const headings: { level: number; text: string; index: number; raw: string }[] = [];
    const regex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(text)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        index: match.index,
        raw: match[0],
      });
    }
    return headings;
  };

  const headings = activeDoc ? parseHeadings(activeDoc.content) : [];

  // Scroll editor to heading index
  const handleHeadingClick = (headingIndex: number, headingRaw: string) => {
    const textareas = window.document.getElementsByTagName("textarea");
    if (textareas.length > 0) {
      const textarea = textareas[0] as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(headingIndex, headingIndex + headingRaw.length);
      const linesBefore = textarea.value.substring(0, headingIndex).split("\n").length;
      textarea.scrollTop = Math.max(0, (linesBefore - 4) * 20);
    }
  };

  // Template items metadata
  const templatePresets = [
    { name: "Blank", desc: "Start from scratch with a blank page" },
    { name: "Blog Article", desc: "Prefill executive summary, intro, headers, CTA" },
    { name: "YouTube Script", desc: "Prefill hook, intro, outline, body, outro" },
    { name: "Pinterest Pin Copy", desc: "Prefill board pins, keywords, URL drafts" },
    { name: "Newsletter", desc: "Prefill subject, preview text, main story, update list" },
    { name: "Course Outline", desc: "Prefill modules, student criteria, lesson outlines" },
    { name: "Podcast Outline", desc: "Prefill episode details, guest sections, segments" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-200px)] min-h-[600px] text-zinc-900 dark:text-zinc-100 font-sans relative">
      {/* 1. Left Documents Sidebar Panel */}
      <div className="w-full lg:w-64 flex flex-col bg-white dark:bg-[#0e0e11] border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-4 shadow-sm h-full flex-shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-3 mb-3">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={12} /> Studio Documents
          </span>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 transition-colors cursor-pointer"
            title="Create Document"
          >
            <Plus size={14} />
          </button>
        </div>

        {docsLoading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <Loader2 className="animate-spin text-zinc-400" size={16} />
            <p className="text-[9px] text-zinc-500 font-medium">Loading documents...</p>
          </div>
        ) : activeDocs.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-650 font-bold">No documents created.</p>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="text-[9px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center justify-center gap-0.5 mx-auto"
            >
              <PlusCircle size={10} /> Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 max-h-[220px] pr-1 scrollbar-thin pb-2 border-b border-zinc-150 dark:border-zinc-900">
            {activeDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocSlug(doc.slug)}
                className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeDocSlug === doc.slug
                    ? "bg-indigo-50/70 border border-indigo-200/30 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-800/30 dark:text-indigo-400 font-bold"
                    : "text-zinc-600 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                <FileText size={13} className="text-zinc-400 flex-shrink-0" />
                <span className="truncate flex-1">{doc.title}</span>
                <span className="text-[8px] opacity-70 px-1 border border-zinc-200/40 rounded text-zinc-400 uppercase tracking-wide">
                  {doc.template}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Left References Block (Outline, Notes, Knowledge) */}
        {activeDoc && (
          <div className="flex-1 flex flex-col min-h-[240px] mt-4">
            {/* Tabs selector */}
            <div className="flex items-center gap-1 border-b border-zinc-150 dark:border-zinc-900 pb-2 mb-2 font-semibold">
              <button
                onClick={() => setLeftTab("outline")}
                className={`text-[10px] pb-1 px-1.5 transition-all border-b-2 ${
                  leftTab === "outline"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-zinc-500"
                }`}
              >
                Outline
              </button>
              <button
                onClick={() => setLeftTab("notes")}
                className={`text-[10px] pb-1 px-1.5 transition-all border-b-2 ${
                  leftTab === "notes"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-zinc-500"
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setLeftTab("knowledge")}
                className={`text-[10px] pb-1 px-1.5 transition-all border-b-2 ${
                  leftTab === "knowledge"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-zinc-500"
                }`}
              >
                Vault
              </button>
              <button
                onClick={() => setLeftTab("media")}
                className={`text-[10px] pb-1 px-1.5 transition-all border-b-2 ${
                  leftTab === "media"
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "border-transparent text-zinc-500"
                }`}
              >
                Media
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin text-xs">
              {leftTab === "outline" && (
                <div className="space-y-1 pb-4">
                  {headings.length === 0 ? (
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-550 italic font-medium py-4 text-center">
                      No headings found in document yet. Add headers like # or ##.
                    </p>
                  ) : (
                    headings.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => handleHeadingClick(h.index, h.raw)}
                        className="w-full text-left py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/35 transition-colors font-medium truncate block"
                        style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                      >
                        <span className="text-zinc-450 dark:text-zinc-500 mr-1">{"#".repeat(h.level)}</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{h.text}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {leftTab === "notes" && (
                <div className="space-y-1.5 pb-4">
                  {notes.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 italic py-4 text-center">No related project notes.</p>
                  ) : (
                    notes.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNote(n)}
                        className="w-full text-left p-1.5 rounded border border-zinc-100 dark:border-zinc-900/40 hover:border-indigo-500/25 bg-zinc-50/20 dark:bg-zinc-900/10 transition-all font-semibold flex items-start gap-1"
                      >
                        <ChevronRight size={12} className="mt-0.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300 leading-normal">{n.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {leftTab === "knowledge" && (
                <div className="space-y-1.5 pb-4">
                  {knowledge.length === 0 ? (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-650 italic py-4 text-center">No knowledge resources.</p>
                  ) : (
                    knowledge.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setSelectedKnowledge(k)}
                        className="w-full text-left p-1.5 rounded border border-zinc-100 dark:border-zinc-900/40 hover:border-indigo-500/25 bg-zinc-50/20 dark:bg-zinc-900/10 transition-all font-semibold flex items-start gap-1"
                      >
                        <ChevronRight size={12} className="mt-0.5 text-zinc-400 flex-shrink-0" />
                        <span className="truncate flex-1 text-zinc-700 dark:text-zinc-300 leading-normal">{k.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {leftTab === "media" && (
                <div className="space-y-1.5 pb-4 animate-fadeIn font-semibold text-xs">
                  {mediaAssets.length === 0 ? (
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-650 italic py-4 text-center">No project media assets.</p>
                  ) : (
                    mediaAssets.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedMedia(m);
                          setIsMediaDetailsOpen(true);
                        }}
                        className="w-full text-left p-1.5 rounded border border-zinc-100 dark:border-zinc-900/40 hover:border-indigo-500/25 bg-zinc-50/20 dark:bg-zinc-900/10 transition-all flex items-center gap-2"
                      >
                        <ChevronRight size={12} className="text-zinc-400 shrink-0" />
                        {m.asset_type === "Image" && m.thumbnail_url ? (
                          <img src={m.thumbnail_url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[7px] shrink-0 text-zinc-500 font-extrabold uppercase">
                            {m.asset_type.substring(0, 3)}
                          </div>
                        )}
                        <span className="truncate flex-1 text-zinc-755 dark:text-zinc-300 leading-none">{m.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Center Panel: Writing Editor / Empty State */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {activeDoc ? (
          <MarkdownEditor
            document={activeDoc}
            onSave={handleSaveDocument}
            onStatsChange={() => {}}
          />
        ) : (
          /* Reused Empty-State Design System */
          <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-[#0e0e11] border border-zinc-200/50 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm py-16">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shadow-inner">
                <FileSignature size={28} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create your first document</h3>
                <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed font-semibold">
                  Writing Studio is your distraction-free workspace. Choose a template preset to organize blog drafts, YouTube scripts, newsletter content, or podcast outlines.
                </p>
              </div>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Create Your First Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Panel: Document Info & Integrations */}
      {activeDoc && (
        <div className="w-full lg:w-64 flex flex-col bg-white dark:bg-[#0e0e11] border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-4 shadow-sm h-full flex-shrink-0 overflow-y-auto space-y-5">
          {/* Section: Doc settings */}
          <div className="space-y-3 font-semibold text-xs border-b border-zinc-150 dark:border-zinc-900 pb-4">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={12} /> Document Details
            </span>

            {/* Status Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Status</label>
              <select
                value={activeDoc.status}
                onChange={(e) =>
                  updateMutation.mutate({
                    slug: activeDoc.slug,
                    data: { status: e.target.value as any },
                  })
                }
                className="w-full h-8 px-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Review">Review</option>
                <option value="Published">Published (Placeholder)</option>
              </select>
            </div>

            {/* Visibility Select */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wide">Visibility</label>
              <select
                value={activeDoc.visibility}
                onChange={(e) =>
                  updateMutation.mutate({
                    slug: activeDoc.slug,
                    data: { visibility: e.target.value as any },
                  })
                }
                className="w-full h-8 px-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Private">Private</option>
                <option value="Workspace">Workspace</option>
              </select>
            </div>

            {/* Document metadata display */}
            <div className="pt-2 text-[10px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Reading Time:</span>
                <span className="text-zinc-650 dark:text-zinc-350">{activeDoc.reading_time} min</span>
              </div>
              <div className="flex justify-between">
                <span>Word Count:</span>
                <span className="text-zinc-650 dark:text-zinc-350">{activeDoc.word_count} words</span>
              </div>
              <div className="flex justify-between">
                <span>Last Opened:</span>
                <span className="text-zinc-650 dark:text-zinc-350">
                  {activeDoc.last_opened_at ? new Date(activeDoc.last_opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Never"}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Tasks */}
          <div className="space-y-2 pb-4 border-b border-zinc-150 dark:border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={12} /> Linked Tasks
            </span>
            {tasks.length === 0 ? (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 italic">No tasks in project workspace.</p>
            ) : (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {tasks.filter(t => !t.archived).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="w-full text-left p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-900/10 hover:border-indigo-500/25 flex items-center justify-between text-[11px] font-semibold transition-all"
                  >
                    <span className="truncate flex-1 pr-1">{t.title}</span>
                    <span className={`text-[8px] px-1 rounded uppercase tracking-wide font-extrabold ${
                      t.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"
                    }`}>
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar integration */}
          <div className="space-y-2 pb-4 border-b border-zinc-150 dark:border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} /> Content Calendar
            </span>
            {calendarEvents.length === 0 ? (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 italic">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {calendarEvents.filter(e => !e.archived).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className="w-full text-left p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-900/10 hover:border-indigo-500/25 flex flex-col text-[11px] font-semibold transition-all"
                  >
                    <span className="truncate w-full leading-snug">{e.title}</span>
                    <span className="text-[8px] text-zinc-400 font-bold mt-0.5">
                      {new Date(e.start_datetime).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Linked Media */}
          <div className="space-y-2 pb-4 border-b border-zinc-150 dark:border-zinc-900 font-semibold">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
              <Image size={12} /> Linked Media
            </span>
            {mediaAssets.filter((m) => m.related_document === activeDoc.id).length === 0 ? (
              <p className="text-[10px] text-zinc-450 dark:text-zinc-650 italic">No linked media assets.</p>
            ) : (
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {mediaAssets.filter((m) => m.related_document === activeDoc.id).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMedia(m);
                      setIsMediaDetailsOpen(true);
                    }}
                    className="w-full text-left p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-900/10 hover:border-indigo-500/25 flex items-center gap-2 text-[11px] font-semibold transition-all"
                  >
                    {m.asset_type === "Image" && m.thumbnail_url ? (
                      <img src={m.thumbnail_url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[7px] shrink-0 text-zinc-500 font-extrabold uppercase">
                        {m.asset_type.substring(0, 3)}
                      </div>
                    )}
                    <span className="truncate flex-1 pr-1">{m.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-2 pt-1 font-semibold text-xs">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Quick Actions</span>
            <div className="space-y-2">
              <button
                onClick={() => handleDuplicate(activeDoc)}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-[10px]"
              >
                <span className="flex items-center gap-2">
                  <Copy size={11} className="text-zinc-450 dark:text-zinc-550" />
                  Duplicate Document
                </span>
                <ChevronRight size={10} className="text-zinc-400" />
              </button>
              <button
                onClick={() => handleArchive(activeDoc)}
                className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-[10px]"
              >
                <span className="flex items-center gap-2">
                  <Archive size={11} className="text-zinc-455 dark:text-zinc-500" />
                  {activeDoc.archived ? "Restore Document" : "Archive Document"}
                </span>
                <ChevronRight size={10} className="text-zinc-400" />
              </button>
              <button
                onClick={() => {
                  setDocToDelete(activeDoc);
                  setIsDeleteOpen(true);
                }}
                className="w-full h-8 rounded-lg border border-rose-500/10 hover:bg-rose-500/5 text-rose-500 transition-colors flex items-center justify-between px-3 text-[10px]"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={11} className="text-rose-500" />
                  Delete Document
                </span>
                <ChevronRight size={10} className="text-rose-450" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODALS / OVERLAYS */}
      {/* Template Preset Selector Overlay */}
      {showTemplateSelector && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans animate-fadeIn">
            <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Select Document Preset Template</span>
              <button onClick={() => setShowTemplateSelector(false)} className="p-1 rounded hover:bg-zinc-150 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto">
              {templatePresets.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => handleCreateDocument(tpl.name)}
                  className="w-full text-left p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 hover:border-indigo-500/35 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20 transition-all flex justify-between items-center group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">{tpl.name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">{tpl.desc}</div>
                  </div>
                  <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Note Reader Overlay */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans flex flex-col max-h-[80vh]">
            <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Research Note Reference</span>
              <button onClick={() => setSelectedNote(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-900/40 pb-2">{selectedNote.title}</h2>
              <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selectedNote.content || <span className="italic text-zinc-400">No content in this note.</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Item Reader Overlay */}
      {selectedKnowledge && (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans flex flex-col max-h-[80vh]">
            <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Knowledge Vault Reference</span>
              <button onClick={() => setSelectedKnowledge(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-900/40 pb-2">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">{selectedKnowledge.title}</h2>
                <span className="text-[9px] font-bold px-2 py-0.5 border border-indigo-500/10 bg-indigo-50/50 text-indigo-500 dark:bg-indigo-950/20 rounded-full">
                  {selectedKnowledge.type}
                </span>
              </div>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-semibold">
                {selectedKnowledge.description || "No description provided."}
              </p>
              {selectedKnowledge.source_url && (
                <div className="pt-2">
                  <a
                    href={selectedKnowledge.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    Open Reference Link <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Details Overlay */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans flex flex-col">
            <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Linked Task Details</span>
              <button onClick={() => setSelectedTask(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-900/40 pb-2">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">{selectedTask.title}</h2>
                <div className="flex gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedTask.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {selectedTask.status}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-zinc-100 dark:bg-zinc-900">
                    {selectedTask.priority} Priority
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-650 dark:text-zinc-450 leading-relaxed font-semibold">
                {selectedTask.description || "No description provided."}
              </p>
              {selectedTask.due_date && (
                <p className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                  <Calendar size={11} /> Due Date: {new Date(selectedTask.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Event Details Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden font-sans flex flex-col">
            <div className="h-12 border-b border-zinc-200/50 dark:border-zinc-800 px-4 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Calendar Schedule Reference</span>
              <button onClick={() => setSelectedEvent(null)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-900/40 pb-2">
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">{selectedEvent.title}</h2>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500">
                  {selectedEvent.event_type}
                </span>
              </div>
              <p className="text-xs text-zinc-650 dark:text-zinc-450 leading-relaxed font-semibold">
                {selectedEvent.description || "No description provided."}
              </p>
              <div className="text-[10px] text-zinc-400 font-bold space-y-1">
                <p className="flex items-center gap-1"><Calendar size={11} /> Start: {new Date(selectedEvent.start_datetime).toLocaleString()}</p>
                <p className="flex items-center gap-1"><Calendar size={11} /> End: {new Date(selectedEvent.end_datetime).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDocToDelete(null);
        }}
        projectName={docToDelete?.title || ""}
        title="Delete Document"
        confirmText="Delete Document"
        description={docToDelete ? `Are you sure you want to delete "${docToDelete.title}"? This will permanently erase the document contents from this project.` : undefined}
        onConfirm={async () => {
          if (docToDelete) {
            await deleteMutation.mutateAsync(docToDelete.slug);
            if (activeDocSlug === docToDelete.slug) {
              setActiveDocSlug(null);
            }
          }
        }}
        loading={deleteMutation.isPending}
      />

      <MediaDetailsDialog
        isOpen={isMediaDetailsOpen}
        onClose={() => {
          setIsMediaDetailsOpen(false);
          setSelectedMedia(null);
        }}
        asset={selectedMedia}
        projectSlug={projectSlug}
      />
    </div>
  );
}
