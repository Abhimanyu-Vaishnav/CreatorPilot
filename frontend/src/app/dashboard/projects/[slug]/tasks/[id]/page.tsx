"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../../../../components/layout/DashboardLayout";
import {
  useTaskQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
  TaskDialog,
  Task,
  TaskStatus,
  TaskPriority,
} from "../../../../../../features/tasks";
import { useProjectQuery, useProjectActivityQuery } from "../../../../../../features/projects";
import { Breadcrumbs } from "../../../../../../features/projects/components/Breadcrumbs";
import { Timeline } from "../../../../../../features/projects/components/Timeline";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Archive,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Loader2,
  Tag,
  Clock3,
  CalendarDays,
  Bookmark,
} from "lucide-react";
import Link from "next/link";

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const taskId = params?.id as string;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Queries
  const { data: task, isLoading: isTaskLoading, isError: isTaskError, error: taskError } = useTaskQuery(taskId);
  const { data: project, isLoading: isProjectLoading } = useProjectQuery(slug);
  const { data: activities = [], isLoading: isActivityLoading } = useProjectActivityQuery(slug, !!task);

  // Mutations
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation(slug);
  const createTaskMutation = useCreateTaskMutation();

  const handleEditSubmit = async (formData: any) => {
    await updateMutation.mutateAsync({
      id: taskId,
      data: formData,
    });
    setIsEditDialogOpen(false);
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    const isCompleted = task.status === "Completed";
    await updateMutation.mutateAsync({
      id: taskId,
      data: { status: isCompleted ? "Todo" : "Completed" },
    });
  };

  const handleToggleFavorite = async () => {
    if (!task) return;
    await updateMutation.mutateAsync({
      id: taskId,
      data: { favorite: !task.favorite },
    });
  };

  const handleToggleArchive = async () => {
    if (!task) return;
    const nextArchiveState = !task.archived;
    await updateMutation.mutateAsync({
      id: taskId,
      data: { archived: nextArchiveState },
    });
    if (nextArchiveState) {
      router.push(`/dashboard/projects/${slug}?tab=tasks`);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await deleteMutation.mutateAsync(task.id);
      router.push(`/dashboard/projects/${slug}?tab=tasks`);
    }
  };

  const handleDuplicate = async () => {
    if (!task || !project) return;
    try {
      const duplicated = await createTaskMutation.mutateAsync({
        project: project.id,
        title: `${task.title} (Copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        start_date: task.start_date,
        due_date: task.due_date,
        estimated_time: task.estimated_time,
        related_note: task.related_note,
        related_knowledge: task.related_knowledge,
      });
      router.push(`/dashboard/projects/${slug}/tasks/${duplicated.id}`);
    } catch (err) {
      console.error("Failed to duplicate task:", err);
    }
  };

  if (isTaskLoading || isProjectLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-650" size={32} />
          <p className="text-xs text-zinc-500 font-medium">Opening task details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isTaskError || !task) {
    return (
      <DashboardLayout>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Task Error:</span>{" "}
            {taskError instanceof Error ? taskError.message : "Task not found."}
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={`/dashboard/projects/${slug}?tab=tasks`}
            className="text-xs font-semibold text-indigo-650 flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Project Tasks
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Filter activities to only show ones related to this task ID
  const taskActivities = activities.filter(
    (act) => act.metadata && Number(act.metadata.task_id) === Number(taskId)
  );

  // Format breadcrumbs
  const customBreadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/dashboard/projects" },
    { label: project?.title || "Project", href: `/dashboard/projects/${slug}` },
    { label: "Tasks", href: `/dashboard/projects/${slug}?tab=tasks` },
    { label: task.title, href: "" },
  ];

  // Helper date formatters
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    return new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "Urgent":
        return "text-rose-655 bg-rose-500/10 border-rose-500/20";
      case "High":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "Medium":
        return "text-indigo-600 bg-indigo-500/10 border-indigo-500/20";
      default:
        return "text-zinc-600 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case "Completed":
        return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
      case "Blocked":
        return "text-rose-600 bg-rose-500/10 border-rose-500/20";
      case "In Progress":
        return "text-indigo-600 bg-indigo-500/10 border-indigo-500/20";
      default:
        return "text-zinc-600 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 font-sans animate-fadeIn">
        {/* Breadcrumb Trail */}
        <Breadcrumbs customBreadcrumbs={customBreadcrumbs} />

        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/projects/${slug}?tab=tasks`}
              className="p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <ArrowLeft size={16} />
            </Link>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {task.title}
                </h1>
                <button
                  onClick={handleToggleFavorite}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  title={task.favorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Star
                    size={16}
                    className={task.favorite ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-650"}
                  />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold uppercase">
                <span className="text-zinc-500 dark:text-zinc-500">{project?.title}</span>
                <span>•</span>
                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-2 font-bold text-xs">
            <button
              onClick={handleToggleComplete}
              className={`h-9 px-4 rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
                task.status === "Completed"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-indigo-650 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/15"
              }`}
            >
              <CheckCircle size={14} />
              {task.status === "Completed" ? "Completed" : "Mark Complete"}
            </button>
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Left Column: Details & Linking */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description Card */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3 shadow-sm">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Task Description
              </h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                {task.description || "No description provided for this task. Click Edit Details to add deliverables or guidelines."}
              </p>
            </div>

            {/* Cross-Linked Resources */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm font-semibold">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Linked Project Resources
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Linked Note card */}
                <div className="border border-zinc-150 dark:border-zinc-900/50 p-4 rounded-xl space-y-3 bg-zinc-50/20 dark:bg-zinc-900/5 font-semibold">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={12} /> Connected Note
                  </span>
                  
                  {task.related_note ? (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{task.note_title}</h4>
                      <Link
                        href={`/dashboard/projects/${slug}/notes/${task.note_slug}`}
                        className="text-[10px] text-indigo-650 hover:underline mt-1.5 block font-sans font-bold"
                      >
                        Open Linked Note →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">No note resource linked to this task.</p>
                  )}
                </div>

                {/* Linked Knowledge item card */}
                <div className="border border-zinc-150 dark:border-zinc-900/50 p-4 rounded-xl space-y-3 bg-zinc-50/20 dark:bg-zinc-900/5 font-semibold">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Database size={12} /> Connected Vault Knowledge
                  </span>
                  
                  {task.related_knowledge ? (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{task.knowledge_title}</h4>
                      <Link
                        href={`/dashboard/projects/${slug}/knowledge/${task.knowledge_slug}`}
                        className="text-[10px] text-indigo-650 hover:underline mt-1.5 block font-sans font-bold"
                      >
                        Open Vault Resource →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">No vault item linked to this task.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Task Timeline / Activity Feed */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900/60 pb-2.5">
                Task Execution Timeline
              </h3>
              <Timeline activities={taskActivities} isLoading={isActivityLoading} />
            </div>

          </div>

          {/* Right Column: Parameters and Actions Sidebar */}
          <div className="space-y-6">
            
            {/* Metadata Parameters Card */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 font-semibold text-xs text-zinc-800 dark:text-zinc-200">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Parameters</h3>
              
              <div className="space-y-3.5 divide-y divide-zinc-100 dark:divide-zinc-900/30">
                
                {/* StatusBadge */}
                <div className="flex justify-between items-center pt-2 first:pt-0">
                  <span className="text-zinc-500">Task Status</span>
                  <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full uppercase ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </span>
                </div>

                {/* PriorityBadge */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-500">Priority Level</span>
                  <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full uppercase ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Estimated Time */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-500 flex items-center gap-1"><Clock3 size={13} className="text-zinc-400" /> Est Time</span>
                  <span className="font-bold">{task.estimated_time > 0 ? `${task.estimated_time} minutes` : "None set"}</span>
                </div>

                {/* Start Date */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-500 flex items-center gap-1"><CalendarDays size={13} className="text-zinc-400" /> Start Date</span>
                  <span className="font-bold text-[10px] text-zinc-650 dark:text-zinc-350">{formatDate(task.start_date)}</span>
                </div>

                {/* Due Date */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-500 flex items-center gap-1"><CalendarDays size={13} className="text-zinc-400" /> Due Date</span>
                  <span className="font-bold text-[10px] text-zinc-655 dark:text-zinc-350">{formatDate(task.due_date)}</span>
                </div>

                {/* Completed At */}
                {task.completed_at && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-500 flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" /> Completed</span>
                    <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-450">{formatDate(task.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quick Actions</h3>
              
              <div className="space-y-2.5 font-semibold">
                <button
                  onClick={handleDuplicate}
                  className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex items-center gap-2">
                    <Copy size={13} />
                    Duplicate Task
                  </span>
                </button>

                <button
                  onClick={handleToggleArchive}
                  className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex items-center gap-2">
                    <Archive size={13} />
                    {task.archived ? "Restore Task" : "Archive Task"}
                  </span>
                </button>

                <button
                  onClick={handleDelete}
                  className="w-full h-9 rounded-xl border border-rose-500/10 hover:bg-rose-500/5 transition-colors flex items-center justify-between px-3 text-xs text-rose-500"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={13} />
                    Delete Task
                  </span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Edit Form Dialog */}
      <TaskDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        projectSlug={slug}
        task={task}
        loading={updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
