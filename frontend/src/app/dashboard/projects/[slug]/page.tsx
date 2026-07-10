"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import {
  useProjectQuery,
  useProjectActivityQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useCreateProjectMutation,
  Project,
  ProjectDialog,
  DeleteConfirmationDialog,
  ProjectIcon,
} from "../../../../features/projects";
import { Breadcrumbs } from "../../../../features/projects/components/Breadcrumbs";
import { Timeline } from "../../../../features/projects/components/Timeline";
import { NotesWorkspace, useProjectNotesQuery } from "../../../../features/notes";
import { KnowledgeWorkspace, useProjectKnowledgeQuery } from "../../../../features/vault";
import { TasksWorkspace, useProjectTasksQuery } from "../../../../features/tasks";
import { CalendarWorkspace } from "../../../../features/planner";
import { WritingWorkspace, useProjectDocumentsQuery } from "../../../../features/studio";
import { MediaWorkspace, useProjectMediaQuery } from "../../../../features/media";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Folder,
  Tag,
  Loader2,
  AlertCircle,
  FileText,
  CheckSquare,
  Image,
  Database,
  CalendarDays,
  Settings,
  Star,
  Lock,
  Edit,
  Copy,
  Archive,
  Trash2,
  Sliders,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

type TabName = "overview" | "notes" | "tasks" | "media" | "vault" | "calendar" | "timeline" | "settings" | "writing";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;

  const tabParam = searchParams?.get("tab") as TabName;
  const [activeTab, setActiveTab] = useState<TabName>(
    (tabParam && ["overview", "notes", "tasks", "media", "vault", "calendar", "timeline", "settings", "writing"].includes(tabParam))
      ? tabParam
      : "overview"
  );

  // Sync tab state when URL search params change
  useEffect(() => {
    const tabParam = searchParams?.get("tab") as TabName;
    if (tabParam && ["overview", "notes", "tasks", "media", "vault", "calendar", "timeline", "settings", "writing"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    router.push(`/dashboard/projects/${slug}?tab=${tab}`, { scroll: false });
  };
  
  // Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Queries
  const { data: project, isLoading: isProjectLoading, isError, error } = useProjectQuery(slug);
  const { data: activities = [], isLoading: isActivityLoading } = useProjectActivityQuery(slug, !!project);
  const { data: projectNotes = [] } = useProjectNotesQuery(slug, !!project);
  const { data: projectKnowledge = [] } = useProjectKnowledgeQuery(slug, undefined, !!project);
  const { data: projectTasks = [] } = useProjectTasksQuery(slug, !!project);
  const { data: projectDocuments = [] } = useProjectDocumentsQuery(slug, !!project);
  const { data: projectMedia = [] } = useProjectMediaQuery(slug, undefined, !!project);

  // Mutations
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();
  const createMutation = useCreateProjectMutation();

  if (isProjectLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-650" size={32} />
          <p className="text-xs text-zinc-500 font-medium">Opening project workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !project) {
    return (
      <DashboardLayout>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Project Error:</span>{" "}
            {error instanceof Error ? error.message : "Project not found. Ensure slug is correct."}
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-indigo-650"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Format Dates
  const createdDate = new Date(project.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const updatedDate = new Date(project.updated_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const activeNotesCount = projectNotes.filter((n) => !n.archived).length;
  const activeKnowledgeCount = projectKnowledge.filter((k) => !k.archived).length;
  const activeTasksCount = projectTasks.filter((t) => !t.archived).length;
  const activeDocumentsCount = projectDocuments.filter((d) => !d.archived).length;
  const activeMediaCount = projectMedia.filter((m) => !m.archived).length;

  const tabs: { id: TabName; label: string; icon: any; lock?: boolean; count?: number }[] = [
    { id: "overview", label: "Overview", icon: Folder },
    { id: "writing", label: "Writing Studio", icon: Edit, count: activeDocumentsCount },
    { id: "notes", label: "Notes", icon: FileText, count: activeNotesCount },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: activeTasksCount },
    { id: "media", label: "Media Library", icon: Image, count: activeMediaCount },
    { id: "vault", label: "Knowledge Vault", icon: Database, count: activeKnowledgeCount },
    { id: "calendar", label: "Content Calendar", icon: CalendarDays },
    { id: "timeline", label: "Activity Timeline", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings, lock: true },
  ];

  const handleEditSubmit = async (formData: any) => {
    await updateMutation.mutateAsync({
      slug: project.slug,
      data: formData,
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(project.slug);
    setIsDeleteConfirmOpen(false);
    router.push("/dashboard/projects");
  };

  const handleToggleFavorite = async () => {
    await updateMutation.mutateAsync({
      slug: project.slug,
      data: { favorite: !project.favorite },
    });
  };

  const handleToggleArchive = async () => {
    const isArchiving = !project.archived;
    await updateMutation.mutateAsync({
      slug: project.slug,
      data: { archived: isArchiving },
    });
    if (isArchiving) {
      router.push("/dashboard/projects");
    }
  };

  const handleDuplicateProject = async () => {
    setIsDuplicating(true);
    try {
      const duplicated = await createMutation.mutateAsync({
        title: `${project.title} (Copy)`,
        description: project.description,
        category: project.category,
        status: project.status,
        color: project.color,
        icon: project.icon,
        template: project.template,
        project_progress: project.project_progress || 0,
      });
      router.push(`/dashboard/projects/${duplicated.slug}`);
    } catch (err) {
      console.error("Failed to duplicate project", err);
    } finally {
      setIsDuplicating(false);
    }
  };

  // Get status details
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "In Progress":
        return "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border-indigo-500/20";
      case "Completed":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-500/20";
      case "Paused":
        return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-500/20";
      default:
        return "text-zinc-600 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-900/40 border-zinc-500/20";
    }
  };

  // Calculate stats
  const ageDelta = Date.now() - new Date(project.created_at).getTime();
  const ageDays = Math.max(0, Math.floor(ageDelta / (1000 * 60 * 60 * 24)));

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Reusable Breadcrumbs */}
        <Breadcrumbs projectName={project.title} projectColor={project.color} />

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-4">
            {/* Custom Icon Container */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                color: project.color,
                backgroundColor: `${project.color}15`,
                border: `1px solid ${project.color}30`,
              }}
            >
              <ProjectIcon name={project.icon} size={24} />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {project.title}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  title={project.favorite ? "Unstar Favorites" : "Add to Favorites"}
                >
                  <Star
                    size={16}
                    className={project.favorite ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-600"}
                  />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {project.category}
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadgeStyle(project.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] text-zinc-500 space-y-1 font-medium">
            <p className="flex items-center gap-1 md:justify-end">
              <Calendar size={12} />
              Created on {createdDate}
            </p>
            <p className="flex items-center gap-1 md:justify-end">
              <Clock size={12} />
              Last active: {updatedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="flex items-center gap-1 border-b border-zinc-200/60 dark:border-zinc-800/50 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`h-9 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-indigo-500/10">
                  {tab.count}
                </span>
              )}
              {tab.lock && (
                <Lock size={10} className="text-zinc-400 dark:text-zinc-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace Area */}
      <div className="pt-4">
        {activeTab === "overview" ? (
          /* Overview Panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description & metadata cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Project Information */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Folder size={16} className="text-zinc-400" />
                  Project Goals & Description
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {project.description || "No project description provided yet. Click edit in the Quick Actions sidebar to add details and outline deliverables."}
                </p>
              </div>

              {/* Card 2: Progress System */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <TrendingUp size={16} className="text-zinc-400" />
                    Workspace Progress
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                    <span>Overall Completeness</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{project.project_progress || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${project.project_progress || 0}%`,
                        backgroundColor: project.color || "#6366f1",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    This progress indicators will auto-calculate when related modules (Notes, Tasks, Media Library) are connected.
                  </p>
                </div>
              </div>

              {/* Card: Recent Project Notes */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText size={16} className="text-zinc-400" />
                    Recent Notes & Drafts
                  </h3>
                  <button
                    onClick={() => handleTabChange("notes")}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-sans"
                  >
                    View All Notes
                  </button>
                </div>
                
                {projectNotes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center font-semibold">
                    No notes created in this project workspace yet. Switch to the Notes tab to add your first draft.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                    {[...projectNotes]
                      .filter((n) => !n.archived)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((note) => (
                        <Link
                          key={note.id}
                          href={`/dashboard/projects/${slug}/notes/${note.slug}`}
                          className="flex items-center justify-between py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors px-1 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: note.color || "#6366f1" }} />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate block">
                                {note.title}
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate block mt-0.5 max-w-[300px]">
                                {note.excerpt || "No description."}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-zinc-400 flex-shrink-0 font-semibold pl-4">
                            <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide text-zinc-550">
                              {note.template}
                            </span>
                            {note.status === "Published" ? (
                              <span className="bg-indigo-50/80 border border-indigo-200/30 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold">
                                Published
                              </span>
                            ) : (
                              <span className="bg-zinc-150/40 border border-zinc-200/20 text-zinc-550 dark:bg-zinc-900/30 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold">
                                Draft
                              </span>
                            )}
                            <span className="hidden sm:inline font-semibold text-[10px] text-zinc-450 dark:text-zinc-500">{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              {/* Card 3: Activity Timeline */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <Activity size={16} className="text-zinc-400" />
                  Activity Timeline
                </h3>
                <Timeline activities={activities} isLoading={isActivityLoading} />
              </div>

            </div>

            {/* Right side info panel */}
            <div className="space-y-6">
              
              {/* Card 4: Quick Actions */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quick Actions</h3>
                <div className="space-y-2 font-semibold">
                  <button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <Edit size={13} />
                      Edit Project Details
                    </span>
                    <ArrowUpRight size={12} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={13} />
                      Open Settings
                    </span>
                    <ArrowUpRight size={12} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={handleDuplicateProject}
                    disabled={isDuplicating}
                    className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 disabled:opacity-60 transition-colors flex items-center justify-between px-3 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      {isDuplicating ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                      Duplicate Workspace
                    </span>
                    <ArrowUpRight size={12} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={handleToggleArchive}
                    className={`w-full h-9 rounded-xl border transition-colors flex items-center justify-between px-3 text-xs font-semibold ${
                      project.archived
                        ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Archive size={13} />
                      {project.archived ? "Restore Workspace" : "Archive Workspace"}
                    </span>
                    <ArrowUpRight size={12} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="w-full h-9 rounded-xl border border-rose-500/10 hover:bg-rose-500/5 transition-colors flex items-center justify-between px-3 text-xs text-rose-500"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 size={13} />
                      Delete Project
                    </span>
                    <ArrowUpRight size={12} className="text-rose-400" />
                  </button>
                </div>
              </div>

              {/* Card 5: Project Statistics */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Project Statistics</h3>
                <div className="space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 text-zinc-800 dark:text-zinc-200">
                    <span className="text-zinc-500">Project Age</span>
                    <span>{ageDays} {ageDays === 1 ? "day" : "days"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 text-zinc-800 dark:text-zinc-200">
                    <span className="text-zinc-500">Total Activity Logs</span>
                    <span>{activities.length} entries</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 text-zinc-800 dark:text-zinc-200">
                    <span className="text-zinc-500">Notes Count</span>
                    <span>{activeNotesCount} notes</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 text-zinc-800 dark:text-zinc-200">
                    <span className="text-zinc-500">Tasks Count</span>
                    <span>{activeTasksCount} tasks</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 text-zinc-800 dark:text-zinc-200 font-semibold">
                    <span className="text-zinc-500">Media Files</span>
                    <span>{activeMediaCount} {activeMediaCount === 1 ? "file" : "files"}</span>
                  </div>
                </div>
              </div>

              {/* Card 6: Bounded Context specs */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bounded Context Specs</h4>
                <div className="space-y-3 text-xs leading-normal font-medium">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                    <span className="text-zinc-500">Slug Identifier</span>
                    <code className="text-[10px] bg-zinc-50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-200/20 text-zinc-800 dark:text-zinc-200 font-semibold">{project.slug}</code>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                    <span className="text-zinc-500">Active Template</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{project.template} Preset</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Theme Color Accent</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-350 dark:border-zinc-800" style={{ backgroundColor: project.color }} />
                      <span className="font-mono text-[10px] uppercase text-zinc-800 dark:text-zinc-200">{project.color}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === "writing" ? (
          <WritingWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "notes" ? (
          <NotesWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "vault" ? (
          <KnowledgeWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "tasks" ? (
          <TasksWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "media" ? (
          <MediaWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "calendar" ? (
          <CalendarWorkspace projectSlug={project.slug} projectId={project.id} />
        ) : activeTab === "timeline" ? (
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <Activity size={16} className="text-zinc-400" />
              Activity Timeline
            </h3>
            <Timeline activities={activities} isLoading={isActivityLoading} />
          </div>
        ) : (

          /* Placeholder views for locked tabs */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-600 shadow-inner">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Module Coming Soon</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                The {tabs.find((t) => t.id === activeTab)?.label} workspace module is currently locked and will be implemented in a future development phase.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("overview")}
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        )}
      </div>

      {/* Edit Dialog Component */}
      <ProjectDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        project={project}
        loading={updateMutation.isPending}
      />

      {/* Delete Confirmation Component */}
      <DeleteConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        projectName={project.title}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
