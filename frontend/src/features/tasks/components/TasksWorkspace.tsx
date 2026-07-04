"use client";

import React, { useState, useMemo } from "react";
import {
  useProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
} from "../hooks/useTasks";
import { Task, TaskStatus, TaskPriority } from "../types";
import { TaskDialog } from "./TaskDialog";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Archive,
  Edit2,
  FolderLock,
  ArrowUpDown,
  Kanban as KanbanIcon,
  List as ListIcon,
  CheckSquare,
  Lock,
  Eye,
  Loader2,
  FileText,
  Database,
} from "lucide-react";
import Link from "next/link";

interface TasksWorkspaceProps {
  projectSlug: string;
  projectId: number;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: "Todo", label: "Todo", color: "text-zinc-650 dark:text-zinc-400Class", border: "border-zinc-200 dark:border-zinc-800", bg: "bg-zinc-50 dark:bg-[#0c0c0f]" },
  { id: "In Progress", label: "In Progress", color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20", bg: "bg-indigo-50/50 dark:bg-indigo-950/10" },
  { id: "Blocked", label: "Blocked", color: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20", bg: "bg-rose-50/50 dark:bg-rose-950/10" },
  { id: "Completed", label: "Completed", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-50/50 dark:bg-emerald-950/10" },
];

const PRIORITY_BADGES: Record<TaskPriority, { text: string; bg: string; border: string }> = {
  Low: { text: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-900/40", border: "border-zinc-200/20" },
  Medium: { text: "text-indigo-500", bg: "bg-indigo-50/50 dark:bg-indigo-950/15", border: "border-indigo-500/10" },
  High: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/10", border: "border-amber-500/10" },
  Urgent: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/10", border: "border-rose-500/10" },
};

export function TasksWorkspace({ projectSlug, projectId }: TasksWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [ordering, setOrdering] = useState<string>("position");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Task Options Dropdowns state
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<number | null>(null);

  // API Queries & Mutations
  const { data: tasks = [], isLoading } = useProjectTasksQuery(projectSlug);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation(projectSlug);
  const reorderTasksMutation = useReorderTasksMutation(projectSlug);

  // Create or Update task submit handler
  const handleTaskSubmit = async (formData: any) => {
    if (selectedTask) {
      await updateTaskMutation.mutateAsync({
        id: selectedTask.id,
        data: formData,
      });
    } else {
      await createTaskMutation.mutateAsync({
        ...formData,
        project: projectId,
      });
    }
    setIsDialogOpen(false);
    setSelectedTask(null);
  };

  // Quick Action triggers
  const handleToggleFavorite = async (task: Task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { favorite: !task.favorite },
    });
  };

  const handleToggleArchive = async (task: Task) => {
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { archived: !task.archived },
    });
    setActiveMenuTaskId(null);
  };

  const handleDelete = async (task: Task) => {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await deleteTaskMutation.mutateAsync(task.id);
      setActiveMenuTaskId(null);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === "Completed";
    await updateTaskMutation.mutateAsync({
      id: task.id,
      data: { status: isCompleted ? "Todo" : "Completed" },
    });
  };

  const handleDuplicate = async (task: Task) => {
    await createTaskMutation.mutateAsync({
      project: projectId,
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
    setActiveMenuTaskId(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("text/plain", task.id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;
    if (draggedTask.status === targetStatus) return; // Dropped on same column, no-op or just reorder locally

    // Find all tasks that belong to the target column (sorted by position)
    const targetColumnTasks = tasks
      .filter((t) => t.status === targetStatus && t.archived === showArchived)
      .sort((a, b) => a.position - b.position);

    // Build the list of task IDs including the dragged task at the end
    const taskIds = [...targetColumnTasks.map((t) => t.id), taskId];
    
    // Call reorder API
    await reorderTasksMutation.mutateAsync({ taskIds, status: targetStatus });
  };

  // Filter & Sort tasks on Client-Side for instant performance & responsiveness
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter archived/non-archived
    result = result.filter((t) => t.archived === showArchived);

    // Search query on title and description
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Filter by status (mostly for list view)
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Filter by favorite
    if (showFavoritesOnly) {
      result = result.filter((t) => t.favorite);
    }

    // Filter by due today
    if (dueTodayOnly) {
      const today = new Date().toDateString();
      result = result.filter((t) => t.due_date && new Date(t.due_date).toDateString() === today);
    }

    // Filter by overdue
    if (overdueOnly) {
      const now = new Date();
      result = result.filter((t) => t.due_date && new Date(t.due_date) < now && t.status !== "Completed");
    }

    // Apply sorting
    result.sort((a, b) => {
      if (ordering === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (ordering === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (ordering === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (ordering === "updated") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (ordering === "priority") {
        const priorityWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return a.position - b.position;
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, showArchived, showFavoritesOnly, dueTodayOnly, overdueOnly, ordering]);

  // Group tasks by status for Kanban columns
  const kanbanColumns = useMemo(() => {
    const columns: Record<TaskStatus, Task[]> = {
      Todo: [],
      "In Progress": [],
      Blocked: [],
      Completed: [],
    };
    filteredTasks.forEach((t) => {
      if (t.status in columns) {
        columns[t.status].push(t);
      }
    });
    return columns;
  }, [filteredTasks]);

  return (
    <div className="space-y-4 font-sans animate-fadeIn">
      {/* Workspace Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900/60">
        
        {/* Search & Toggle view mode */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={15} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
            />
          </div>

          <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-250/30 dark:border-zinc-800 rounded-lg shadow-inner">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-650 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-650"
              }`}
              title="Kanban Board"
            >
              <KanbanIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md ${
                viewMode === "list"
                  ? "bg-white dark:bg-[#0c0c0f] text-indigo-650 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-650"
              }`}
              title="List View"
            >
              <ListIcon size={14} />
            </button>
          </div>
        </div>

        {/* Action Button & Main Filters */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsDialogOpen(true);
            }}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-600/10 flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            Add Task
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="flex flex-wrap gap-2 items-center bg-zinc-50/50 dark:bg-[#0e0e11]/20 border border-zinc-200/50 dark:border-zinc-900/60 p-3 rounded-xl">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-2">
          <SlidersHorizontal size={11} /> Filters
        </span>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="h-7 px-2 text-[10px] bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800 rounded-lg outline-none font-semibold text-zinc-600 dark:text-zinc-300"
        >
          <option value="all">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        {/* Status Filter (List View only) */}
        {viewMode === "list" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-7 px-2 text-[10px] bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800 rounded-lg outline-none font-semibold text-zinc-600 dark:text-zinc-300"
          >
            <option value="all">All Statuses</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
        )}

        {/* Starred Favorite */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`h-7 px-2.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
            showFavoritesOnly
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-white dark:bg-[#0c0c0f] border-zinc-200/60 dark:border-zinc-800 text-zinc-550 hover:text-zinc-700"
          }`}
        >
          <Star size={11} className={showFavoritesOnly ? "fill-amber-500" : ""} />
          Favorites
        </button>

        {/* Due Today */}
        <button
          onClick={() => {
            setDueTodayOnly(!dueTodayOnly);
            if (overdueOnly) setOverdueOnly(false);
          }}
          className={`h-7 px-2.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
            dueTodayOnly
              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-650 dark:text-indigo-400"
              : "bg-white dark:bg-[#0c0c0f] border-zinc-200/60 dark:border-zinc-800 text-zinc-550 hover:text-zinc-700"
          }`}
        >
          <Calendar size={11} />
          Due Today
        </button>

        {/* Overdue */}
        <button
          onClick={() => {
            setOverdueOnly(!overdueOnly);
            if (dueTodayOnly) setDueTodayOnly(false);
          }}
          className={`h-7 px-2.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
            overdueOnly
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-white dark:bg-[#0c0c0f] border-zinc-200/60 dark:border-zinc-800 text-zinc-550 hover:text-zinc-700"
          }`}
        >
          <AlertCircle size={11} />
          Overdue
        </button>

        {/* Archived filter toggle */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`h-7 px-2.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all ml-auto ${
            showArchived
              ? "bg-amber-600/10 border-amber-600/20 text-amber-700 dark:text-amber-400"
              : "bg-white dark:bg-[#0c0c0f] border-zinc-200/60 dark:border-zinc-800 text-zinc-550 hover:text-zinc-700"
          }`}
        >
          <Archive size={11} />
          {showArchived ? "Viewing Archived" : "Active Tasks"}
        </button>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 ml-2">
          <ArrowUpDown size={11} />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="h-7 px-1.5 bg-transparent border-0 outline-none text-zinc-600 dark:text-zinc-300 font-bold"
          >
            <option value="position">Reorder Position</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Render */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-650" size={32} />
          <p className="text-xs text-zinc-500 font-medium">Fetching workspace tasks...</p>
        </div>
      ) : tasks.filter(t => t.archived === showArchived).length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm py-16">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <CheckSquare size={28} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create your first task</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed font-semibold">
              Tasks keep your projects moving. Define actions, set due dates, assign priority levels, and drag them across your Kanban workflow board.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTask(null);
              setIsDialogOpen(true);
            }}
            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Your First Task
          </button>
        </div>
      ) : (
        /* Render Kanban or List Views */
        viewMode === "kanban" ? (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const columnTasks = kanbanColumns[col.id];
              return (
                <div
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col min-h-[400px] max-h-[600px] border rounded-2xl p-4 shadow-sm ${col.border} ${col.bg}`}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-150/40 dark:border-zinc-800/50 mb-3 flex-shrink-0">
                    <span className={`text-xs font-bold flex items-center gap-2 ${col.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {col.label}
                    </span>
                    <span className="bg-zinc-200/50 dark:bg-zinc-800/80 border border-zinc-200/20 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-zinc-650 dark:text-zinc-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Tasks List inside column */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-[10px] text-zinc-400 border border-dashed border-zinc-200/60 dark:border-zinc-800/60 rounded-xl">
                        Drag tasks here
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          className="p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0c0c0f] hover:border-indigo-500/40 dark:hover:border-indigo-500/30 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all space-y-2 group relative"
                        >
                          {/* Task Top Stats & Options */}
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                              PRIORITY_BADGES[task.priority]?.bg
                            } ${PRIORITY_BADGES[task.priority]?.border} ${PRIORITY_BADGES[task.priority]?.text}`}>
                              {task.priority}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleFavorite(task)}
                                className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"
                              >
                                <Star
                                  size={11}
                                  className={task.favorite ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-600"}
                                />
                              </button>
                              
                              <button
                                onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                                className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-400 group-hover:text-zinc-600"
                              >
                                <MoreHorizontal size={11} />
                              </button>

                              {/* Quick Actions Dropdown Menu */}
                              {activeMenuTaskId === task.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setActiveMenuTaskId(null)}
                                  />
                                  <div className="absolute right-2 top-8 z-20 w-32 border border-zinc-250/50 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-xl shadow-lg p-1 text-[10px] font-semibold space-y-0.5">
                                    <Link
                                      href={`/dashboard/projects/${projectSlug}/tasks/${task.id}`}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                                    >
                                      <Eye size={11} /> View Details
                                    </Link>
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsDialogOpen(true);
                                        setActiveMenuTaskId(null);
                                      }}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                                    >
                                      <Edit2 size={11} /> Edit Task
                                    </button>
                                    <button
                                      onClick={() => handleDuplicate(task)}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                                    >
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={() => handleToggleArchive(task)}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                                    >
                                      {task.archived ? "Restore" : "Archive"}
                                    </button>
                                    <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
                                    <button
                                      onClick={() => handleDelete(task)}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 w-full text-left font-bold"
                                    >
                                      <Trash2 size={11} /> Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Task Content */}
                          <div className="space-y-1">
                            <Link
                              href={`/dashboard/projects/${projectSlug}/tasks/${task.id}`}
                              className="font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:text-indigo-650 dark:hover:text-indigo-400 line-clamp-2 block leading-normal"
                            >
                              {task.title}
                            </Link>
                            {task.description && (
                              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Task Metadata Icons */}
                          <div className="flex flex-wrap items-center gap-2 text-[9px] text-zinc-400 font-bold pt-1 border-t border-zinc-100 dark:border-zinc-900/30">
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                <Calendar size={10} />
                                {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {task.estimated_time > 0 && (
                              <span className="flex items-center gap-1 text-zinc-400">
                                <Clock size={10} />
                                {task.estimated_time}m
                              </span>
                            )}
                            {task.note_title && (
                              <span className="flex items-center gap-0.5 text-indigo-500 max-w-[80px] truncate" title={`Linked Note: ${task.note_title}`}>
                                <FileText size={9} />
                                {task.note_title}
                              </span>
                            )}
                            {task.knowledge_title && (
                              <span className="flex items-center gap-0.5 text-indigo-500 max-w-[80px] truncate" title={`Linked Knowledge: ${task.knowledge_title}`}>
                                <Database size={9} />
                                {task.knowledge_title}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-[#0c0c0f] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-zinc-50 dark:bg-[#0e0e11]/80 text-[10px] uppercase text-zinc-450 dark:text-zinc-500 border-b border-zinc-200/50 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Est Time</th>
                  <th className="py-3 px-3">Resources</th>
                  <th className="py-3 px-4 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-900/60">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-[#0f0f13]/10 text-zinc-800 dark:text-zinc-200 group"
                  >
                    {/* Status checkbox toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="text-zinc-400 hover:text-indigo-600 transition-colors"
                      >
                        {task.status === "Completed" ? (
                          <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-500/10" />
                        ) : (
                          <div className="w-4 h-4 rounded border-2 border-zinc-300 dark:border-zinc-700" />
                        )}
                      </button>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-3 min-w-0">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/projects/${projectSlug}/tasks/${task.id}`}
                            className={`font-bold text-xs text-zinc-900 dark:text-zinc-50 hover:text-indigo-650 dark:hover:text-indigo-400 ${
                              task.status === "Completed" ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                            }`}
                          >
                            {task.title}
                          </Link>
                          {task.favorite && (
                            <Star size={10} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 line-clamp-1 leading-normal max-w-lg font-medium">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                        PRIORITY_BADGES[task.priority]?.bg
                      } ${PRIORITY_BADGES[task.priority]?.border} ${PRIORITY_BADGES[task.priority]?.text}`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-3 font-semibold text-zinc-500 dark:text-zinc-400">
                      {task.due_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>

                    {/* Estimated Time */}
                    <td className="py-3.5 px-3 font-semibold text-zinc-400">
                      {task.estimated_time > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {task.estimated_time}m
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Cross-linking Resources */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        {task.note_title && (
                          <span
                            className="bg-indigo-50 border border-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-950/50 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 font-bold max-w-[120px] truncate"
                            title={`Linked Note: ${task.note_title}`}
                          >
                            <FileText size={9} />
                            {task.note_title}
                          </span>
                        )}
                        {task.knowledge_title && (
                          <span
                            className="bg-emerald-50 border border-emerald-100 text-emerald-650 dark:bg-emerald-950/20 dark:border-emerald-950/50 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 font-bold max-w-[120px] truncate"
                            title={`Linked Knowledge: ${task.knowledge_title}`}
                          >
                            <Database size={9} />
                            {task.knowledge_title}
                          </span>
                        )}
                        {!task.note_title && !task.knowledge_title && (
                          <span className="text-zinc-400 font-medium">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-4 text-center relative">
                      <button
                        onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-400 hover:text-zinc-650 transition-colors"
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {activeMenuTaskId === task.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenuTaskId(null)}
                          />
                          <div className="absolute right-4 top-10 z-20 w-32 border border-zinc-250/50 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-xl shadow-lg p-1 text-[10px] font-semibold space-y-0.5 text-left">
                            <Link
                              href={`/dashboard/projects/${projectSlug}/tasks/${task.id}`}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                            >
                              <Eye size={11} /> View Details
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setIsDialogOpen(true);
                                setActiveMenuTaskId(null);
                              }}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                            >
                              <Edit2 size={11} /> Edit Task
                            </button>
                            <button
                              onClick={() => handleDuplicate(task)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleToggleArchive(task)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 w-full text-left"
                            >
                              {task.archived ? "Restore" : "Archive"}
                            </button>
                            <div className="border-t border-zinc-100 dark:border-zinc-900 my-1" />
                            <button
                              onClick={() => handleDelete(task)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 w-full text-left font-bold"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Reusable Dialog Form */}
      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleTaskSubmit}
        projectSlug={projectSlug}
        task={selectedTask}
        loading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}
