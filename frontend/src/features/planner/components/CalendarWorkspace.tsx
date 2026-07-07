"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Layers,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  Edit3,
  Check,
  CalendarDays,
  ListTodo,
  Info,
  Bookmark,
  Archive
} from "lucide-react";
import {
  useCalendarEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation
} from "../hooks/usePlanner";
import { CalendarEvent, CalendarEventType, CalendarFilterParams } from "../types";
import { EventDialog } from "./EventDialog";
import { useProjectsQuery, DeleteConfirmationDialog } from "../../projects";


interface CalendarWorkspaceProps {
  projectSlug?: string;
  projectId?: number;
}

type ViewMode = "month" | "week" | "day" | "agenda";

export function CalendarWorkspace({ projectSlug = "", projectId = undefined }: CalendarWorkspaceProps) {
  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(
    projectId ? String(projectId) : "all"
  );
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [completedTasksFilter, setCompletedTasksFilter] = useState<string>("all"); // "all" | "completed" | "active"

  // Dialog State
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<CalendarEvent | null>(null);
  const [initialDateForCreate, setInitialDateForCreate] = useState<string>("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);


  // Fetch Projects for Filter list
  const { data: projectsData } = useProjectsQuery({ limit: 100 });
  const projectsList = projectsData?.results || [];

  // Compute start/end dates based on current view/month for API range queries
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    let start = new Date(year, month - 1, 20); // fetch some cushion
    let end = new Date(year, month + 1, 15);

    if (viewMode === "week") {
      const dayOfWeek = currentDate.getDay();
      start = new Date(currentDate.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (viewMode === "day") {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start_date: start.toISOString(),
      end_date: end.toISOString()
    };
  }, [currentDate, viewMode]);

  // Combined Filters for API
  const apiFilters = useMemo((): CalendarFilterParams => {
    const f: CalendarFilterParams = {
      ...dateRange
    };
    if (projectSlug) {
      f.project = projectSlug;
    } else if (selectedProjectFilter !== "all") {
      f.project = selectedProjectFilter;
    }
    if (selectedEventType !== "all") {
      f.event_type = selectedEventType;
    }
    if (searchQuery.trim()) {
      f.search = searchQuery;
    }
    if (showOnlyToday) {
      f.today = true;
    }
    if (showOnlyUpcoming) {
      f.upcoming = true;
    }
    if (completedTasksFilter === "completed") {
      f.completed_tasks = true;
    } else if (completedTasksFilter === "active") {
      f.completed_tasks = false;
    }
    return f;
  }, [
    dateRange,
    projectSlug,
    selectedProjectFilter,
    selectedEventType,
    searchQuery,
    showOnlyToday,
    showOnlyUpcoming,
    completedTasksFilter
  ]);

  // Fetch Events
  const { data: events = [], isLoading } = useCalendarEventsQuery(apiFilters);

  // Mutations
  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation(projectSlug);

  // Helper: Get month data grid (Month view calculations)
  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startOffset = firstDayOfMonth.getDay(); // 0 is Sunday, etc.
    const totalDays = lastDayOfMonth.getDate();

    const cells: Date[] = [];

    // Prev month days cushion
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(new Date(year, month, -i));
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push(new Date(year, month, i));
    }

    // Next month days cushion
    const totalSlots = cells.length;
    const remainingSlots = totalSlots % 7 === 0 ? 0 : 7 - (totalSlots % 7);
    for (let i = 1; i <= remainingSlots; i++) {
      cells.push(new Date(year, month + 1, i));
    }

    // Fallback: make sure we have exactly 35 or 42 grid items
    while (cells.length < 35) {
      const last = cells[cells.length - 1];
      cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
    }

    return cells;
  }, [currentDate]);

  // Helper: Get week days (Week view calculations)
  const weekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return days;
  }, [currentDate]);

  // Navigate dates
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("text/plain", eventId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (!eventId) return;

    // Find the current event
    const eventToUpdate = events.find((evt) => String(evt.id) === String(eventId));
    if (!eventToUpdate) return;

    const currentStart = new Date(eventToUpdate.start_datetime);
    const currentEnd = new Date(eventToUpdate.end_datetime);
    const duration = currentEnd.getTime() - currentStart.getTime();

    // Map new start/end to match targetDate at the original hour/minute
    const newStart = new Date(targetDate);
    newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    try {
      await updateMutation.mutateAsync({
        id: eventId,
        data: {
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString()
        }
      });
    } catch (err) {
      console.error("Failed to drag and drop event:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // CRUD submits
  const handleEventDialogSubmit = async (formData: any) => {
    if (selectedEventForEdit) {
      await updateMutation.mutateAsync({
        id: selectedEventForEdit.id,
        data: formData
      });
    } else {
      await createMutation.mutateAsync({
        ...formData,
        // Override project if we are in project tab scope
        project: projectId || formData.project
      });
    }
  };

  const handleToggleTaskStatus = async (eventItem: CalendarEvent) => {
    if (!String(eventItem.id).startsWith("task_")) return;

    const newStatus = eventItem.task_status === "Completed" ? "Todo" : "Completed";
    await updateMutation.mutateAsync({
      id: eventItem.id,
      data: {
        task_status: newStatus
      }
    });
  };

  const handleQuickDeleteClick = (e: React.MouseEvent, eventItem: CalendarEvent) => {
    e.stopPropagation();
    setEventToDelete(eventItem);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      await deleteMutation.mutateAsync(eventToDelete.id);
      setIsDeleteConfirmOpen(false);
      setEventToDelete(null);
    }
  };

  const handleQuickArchive = async (e: React.MouseEvent, eventItem: CalendarEvent) => {
    e.stopPropagation();
    try {
      await updateMutation.mutateAsync({
        id: eventItem.id,
        data: {
          archived: true
        }
      });
    } catch (err) {
      console.error("Failed to archive event:", err);
    }
  };


  const handleQuickDuplicate = async (e: React.MouseEvent, eventItem: CalendarEvent) => {
    e.stopPropagation();
    const duration = new Date(eventItem.end_datetime).getTime() - new Date(eventItem.start_datetime).getTime();
    
    // Shift copy to tomorrow
    const newStart = new Date(new Date(eventItem.start_datetime).getTime() + 24 * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + duration);

    await createMutation.mutateAsync({
      title: `${eventItem.title} (Copy)`,
      description: eventItem.description,
      event_type: eventItem.event_type,
      project: eventItem.project,
      start_datetime: newStart.toISOString(),
      end_datetime: newEnd.toISOString(),
      all_day: eventItem.all_day,
      color: eventItem.color,
      reminder_minutes: eventItem.reminder_minutes
    });
  };

  // Group events by day for grid rendering
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((evt) => {
      if (!evt.start_datetime) return;
      const dayStr = new Date(evt.start_datetime).toDateString();
      if (!map[dayStr]) {
        map[dayStr] = [];
      }
      map[dayStr].push(evt);
    });
    return map;
  }, [events]);

  const monthName = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans select-none animate-fadeIn">
      {/* 1. PLANNER SIDEBAR (Filters & Lists) */}
      <div className="w-full lg:w-72 space-y-5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search planning events..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-[#0e0e11] text-xs border border-zinc-200/60 dark:border-zinc-800/80 outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-[#0c0c0f] font-semibold transition-all shadow-sm"
          />
        </div>

        {/* Action Panel: Schedule First/New Event */}
        <button
          onClick={() => {
            setSelectedEventForEdit(null);
            setInitialDateForCreate("");
            setIsEventDialogOpen(true);
          }}
          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={14} />
          Schedule Event
        </button>

        {/* Group: Navigation Mini Calendar */}
        <div className="p-4 rounded-2xl border border-zinc-250/20 bg-white dark:bg-[#0e0e11] shadow-sm space-y-3 font-semibold text-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider dark:text-zinc-500">
              Navigation Panel
            </span>
            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                className="w-5 h-5 rounded border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <ChevronLeft size={10} />
              </button>
              <button
                onClick={handleToday}
                className="px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/80 text-[8px] hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="w-5 h-5 rounded border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <ChevronRight size={10} />
              </button>
            </div>
          </div>
          <div className="text-center font-bold text-zinc-800 dark:text-zinc-200 py-1 border-b border-zinc-50 dark:border-zinc-900/10">
            {monthName}
          </div>
          <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-zinc-400">
            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold">
            {monthCells.slice(0, 35).map((date, idx) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const hasEvents = eventsByDay[date.toDateString()]?.length > 0;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentDate(date)}
                  className={`aspect-square rounded flex flex-col items-center justify-center transition-all relative ${
                    isToday
                      ? "bg-indigo-600 text-white font-bold"
                      : isCurrentMonth
                      ? "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      : "text-zinc-350 dark:text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  {date.getDate()}
                  {hasEvents && !isToday && (
                    <span className="w-1 h-1 rounded-full bg-indigo-500 absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Group */}
        <div className="p-4 rounded-2xl border border-zinc-250/20 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <Filter size={12} className="text-zinc-500" />
            <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider dark:text-zinc-500">
              Planner Filters
            </span>
          </div>

          {/* Event Type Filter */}
          <div className="space-y-1">
            <label className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              Planning Context
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none"
            >
              <option value="all">All Types</option>
              <option value="Content Plan">Content Plan</option>
              <option value="Task">Tasks Only</option>
              <option value="Milestone">Milestones</option>
              <option value="Meeting">Meetings</option>
              <option value="Reminder">Reminders</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          {/* Project Filter (only if not viewing inside project detail page) */}
          {!projectSlug && (
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
                Filter by Project
              </label>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none"
              >
                <option value="all">All Projects</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tasks State Filter */}
          <div className="space-y-1">
            <label className="text-[9px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">
              Task Completion Status
            </label>
            <select
              value={completedTasksFilter}
              onChange={(e) => setCompletedTasksFilter(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none"
            >
              <option value="all">All (Completed & Active)</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Checklist Toggles */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyToday}
                onChange={(e) => setShowOnlyToday(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-650 border-zinc-300 rounded focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-650 dark:text-zinc-350">Scheduled for Today</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUpcoming}
                onChange={(e) => setShowOnlyUpcoming(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-650 border-zinc-300 rounded focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-650 dark:text-zinc-350">Upcoming Events Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. CALENDAR WORKSPACE CANVAS */}
      <div className="flex-1 min-w-0 flex flex-col space-y-4">
        {/* Workspace Canvas Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-[#0e0e11] border border-zinc-250/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {monthName}
            </h2>
            <div className="flex items-center p-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
              <button
                onClick={handlePrev}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-[#0c0c0f] hover:shadow-sm transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-white dark:hover:bg-[#0c0c0f] hover:shadow-sm transition-all"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-[#0c0c0f] hover:shadow-sm transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* View Modes tab controls */}
          <div className="flex items-center p-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl font-bold text-[10px] uppercase tracking-wider">
            {(["month", "week", "day", "agenda"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === mode
                    ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#0e0e11] border border-dashed border-zinc-250/20 rounded-2xl">
            <span className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500 mt-3 font-semibold">Updating Planner Grid...</p>
          </div>
        ) : events.length === 0 && searchQuery.trim() ? (
          /* Search Empty State */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 bg-white/20 dark:bg-[#0e0e11]/20 flex flex-col items-center justify-center py-24">
            <Search size={32} className="text-zinc-400 mb-3" />
            <h3 className="font-bold text-zinc-850 dark:text-zinc-150">No Planning matches</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
              Your search for "{searchQuery}" did not match any schedule events. Try adjust filters.
            </p>
          </div>
        ) : events.length === 0 ? (
          /* FEATURE 16 — Empty State illustration */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm py-16">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <CalendarDays size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Schedule Your First Event</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed font-semibold">
                Unlock productivity by plotting content releases, project milestones, meetings, or action items directly onto the timeline grid.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEventForEdit(null);
                setInitialDateForCreate("");
                setIsEventDialogOpen(true);
              }}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
              aria-label="Schedule Your First Event"
            >
              <Plus size={14} />
              Schedule Your First Event
            </button>
          </div>
        ) : (
          /* 3. CALENDAR VIEWS GRID CANVAS */
          <div className="flex-1 bg-white dark:bg-[#0e0e11] border border-zinc-250/20 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            {/* A. MONTH VIEW */}
            {viewMode === "month" && (
              <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-900 text-center font-bold text-[10px] uppercase tracking-wider text-zinc-400 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
            )}
            {viewMode === "month" && (
              <div className="grid grid-cols-7 grid-rows-5 flex-1 divide-x divide-y divide-zinc-100 dark:divide-zinc-900 border-l border-t border-transparent">
                {monthCells.map((date, idx) => {
                  const dayStr = date.toDateString();
                  const isToday = dayStr === new Date().toDateString();
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const dayEvents = eventsByDay[dayStr] || [];

                  return (
                    <div
                      key={idx}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, date)}
                      onDoubleClick={() => {
                        const monthStr = String(date.getMonth() + 1).padStart(2, "0");
                        const dateStr = String(date.getDate()).padStart(2, "0");
                        setInitialDateForCreate(`${date.getFullYear()}-${monthStr}-${dateStr}`);
                        setSelectedEventForEdit(null);
                        setIsEventDialogOpen(true);
                      }}
                      className={`p-1.5 flex flex-col space-y-1 min-h-[90px] relative hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors group cursor-cell`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isToday
                              ? "bg-indigo-600 text-white font-bold"
                              : isCurrentMonth
                              ? "text-zinc-800 dark:text-zinc-200"
                              : "text-zinc-350 dark:text-zinc-650"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        
                        {/* Inline plus button */}
                        <button
                          onClick={() => {
                            const monthStr = String(date.getMonth() + 1).padStart(2, "0");
                            const dateStr = String(date.getDate()).padStart(2, "0");
                            setInitialDateForCreate(`${date.getFullYear()}-${monthStr}-${dateStr}`);
                            setSelectedEventForEdit(null);
                            setIsEventDialogOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Events list */}
                      <div className="flex-1 overflow-y-auto space-y-1 max-h-[85px] no-scrollbar">
                        {dayEvents.map((evt) => {
                          const isTask = String(evt.id).startsWith("task_");
                          const isCompleted = evt.task_status === "Completed";
                          const isMilestone = evt.event_type === "Milestone";
                          
                          return (
                            <div
                              key={evt.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, evt.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForEdit(evt);
                                setIsEventDialogOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedEventForEdit(evt);
                                  setIsEventDialogOpen(true);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${evt.event_type} event: ${evt.title}`}
                              style={{ borderLeftColor: evt.color || "#6366f1" }}
                              className={`planner-event-card p-1 text-[10px] border-l-2 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded cursor-grab active:cursor-grabbing transition-all flex flex-col font-semibold relative overflow-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 outline-none`}
                            >
                              <div className="flex items-center gap-1">
                                {isTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTaskStatus(evt);
                                    }}
                                    className="shrink-0 w-3 h-3 text-zinc-400 hover:text-indigo-650 outline-none focus-visible:ring-1 focus-visible:ring-indigo-550 rounded"
                                    aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
                                  >
                                    <CheckCircle2 size={10} className={isCompleted ? "text-emerald-500" : ""} />
                                  </button>
                                )}
                                {isMilestone && (
                                  <Bookmark size={9} className="text-amber-500 shrink-0 fill-amber-500/10" />
                                )}
                                <span className={`truncate flex-1 leading-tight ${isCompleted ? "line-through text-zinc-400" : ""}`}>
                                  {evt.title}
                                </span>
                              </div>

                              {/* Hover quick action buttons */}
                              <div className="planner-event-actions absolute right-0.5 top-0 bottom-0 bg-gradient-to-l from-zinc-50 dark:from-zinc-900 pl-4 items-center gap-1 hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventForEdit(evt);
                                    setIsEventDialogOpen(true);
                                  }}
                                  className="w-3.5 h-3.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Edit"
                                  aria-label="Edit Event"
                                >
                                  <Edit3 size={8} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickDuplicate(e, evt)}
                                  className="w-3.5 h-3.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Duplicate"
                                  aria-label="Duplicate Event"
                                >
                                  <Copy size={8} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickArchive(e, evt)}
                                  className="w-3.5 h-3.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Archive"
                                  aria-label="Archive Event"
                                >
                                  <Archive size={8} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickDeleteClick(e, evt)}
                                  className="w-3.5 h-3.5 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                                  title="Delete"
                                  aria-label="Delete Event"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* B. WEEK VIEW */}
            {viewMode === "week" && (
              <div className="flex flex-1 divide-x divide-zinc-100 dark:divide-zinc-900">
                {weekDays.map((date, idx) => {
                  const dayStr = date.toDateString();
                  const isToday = dayStr === new Date().toDateString();
                  const dayEvents = eventsByDay[dayStr] || [];

                  return (
                    <div key={idx} className="flex-1 flex flex-col min-h-0 bg-transparent">
                      <div className="p-3 text-center border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">
                          {date.toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span
                          className={`w-6 h-6 rounded-full font-extrabold text-xs flex items-center justify-center mt-1 ${
                            isToday ? "bg-indigo-600 text-white" : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, date)}
                        className="flex-1 p-3 space-y-2 overflow-y-auto cursor-cell"
                        onDoubleClick={() => {
                          const monthStr = String(date.getMonth() + 1).padStart(2, "0");
                          const dateStr = String(date.getDate()).padStart(2, "0");
                          setInitialDateForCreate(`${date.getFullYear()}-${monthStr}-${dateStr}`);
                          setSelectedEventForEdit(null);
                          setIsEventDialogOpen(true);
                        }}
                      >
                        {dayEvents.map((evt) => {
                          const isTask = String(evt.id).startsWith("task_");
                          const isCompleted = evt.task_status === "Completed";
                          const isMilestone = evt.event_type === "Milestone";
                          return (
                            <div
                              key={evt.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, evt.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForEdit(evt);
                                setIsEventDialogOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedEventForEdit(evt);
                                  setIsEventDialogOpen(true);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${evt.event_type} event: ${evt.title}`}
                              style={{ borderLeftColor: evt.color }}
                              className="planner-event-card p-2.5 rounded-xl border-l-2 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-grab flex flex-col gap-1 transition-all relative overflow-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 outline-none"
                            >
                              <div className="flex items-center gap-1.5">
                                {isTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTaskStatus(evt);
                                    }}
                                    className="shrink-0 text-zinc-400 hover:text-indigo-650 outline-none focus-visible:ring-1 focus-visible:ring-indigo-550 rounded"
                                    aria-label={isCompleted ? "Mark task incomplete" : "Mark task complete"}
                                  >
                                    <CheckCircle2 size={12} className={isCompleted ? "text-emerald-500" : ""} />
                                  </button>
                                )}
                                {isMilestone && (
                                  <Bookmark size={11} className="text-amber-500 shrink-0 fill-amber-500/10" />
                                )}
                                <span className={`truncate font-bold flex-1 ${isCompleted ? "line-through text-zinc-400" : ""}`}>
                                  {evt.title}
                                </span>
                              </div>
                              {evt.description && (
                                <p className="text-[10px] text-zinc-400 truncate font-medium">
                                  {evt.description}
                                </p>
                              )}
                              
                              <div className="planner-event-actions absolute right-1 top-0 bottom-0 bg-gradient-to-l from-zinc-50 dark:from-zinc-900 pl-4 items-center gap-1.5 hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventForEdit(evt);
                                    setIsEventDialogOpen(true);
                                  }}
                                  className="w-4 h-4 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Edit"
                                  aria-label="Edit Event"
                                >
                                  <Edit3 size={9} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickDuplicate(e, evt)}
                                  className="w-4 h-4 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Duplicate"
                                  aria-label="Duplicate Event"
                                >
                                  <Copy size={9} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickArchive(e, evt)}
                                  className="w-4 h-4 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                                  title="Archive"
                                  aria-label="Archive Event"
                                >
                                  <Archive size={9} />
                                </button>
                                <button
                                  onClick={(e) => handleQuickDeleteClick(e, evt)}
                                  className="w-4 h-4 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 flex items-center justify-center outline-none focus-visible:ring-1 focus-visible:ring-red-550"
                                  title="Delete"
                                  aria-label="Delete Event"
                                >
                                  <Trash2 size={9} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* C. DAY VIEW */}
            {viewMode === "day" && (
              <div className="flex-1 flex flex-col p-4 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      {currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    <p className="text-[10px] text-zinc-400">Viewing hourly and scheduled planning list for today.</p>
                  </div>
                  <button
                    onClick={() => {
                      const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
                      const dateStr = String(currentDate.getDate()).padStart(2, "0");
                      setInitialDateForCreate(`${currentDate.getFullYear()}-${monthStr}-${dateStr}`);
                      setSelectedEventForEdit(null);
                      setIsEventDialogOpen(true);
                    }}
                    className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                  >
                    <Plus size={11} /> New Event
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[450px]">
                  {(eventsByDay[currentDate.toDateString()] || []).length === 0 ? (
                    <div className="py-20 text-center text-xs text-zinc-400 font-semibold">
                      No schedule events scheduled for this day. Double click grid or tap New Event to construct.
                    </div>
                  ) : (
                    (eventsByDay[currentDate.toDateString()] || []).map((evt) => {
                      const isTask = String(evt.id).startsWith("task_");
                      const isCompleted = evt.task_status === "Completed";
                      const isMilestone = evt.event_type === "Milestone";
                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setSelectedEventForEdit(evt);
                            setIsEventDialogOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedEventForEdit(evt);
                              setIsEventDialogOpen(true);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${evt.event_type} event: ${evt.title}`}
                          style={{ borderLeftColor: evt.color }}
                          className="planner-event-card p-4 rounded-xl border-l-3 bg-zinc-50/50 dark:bg-zinc-900/20 text-xs font-semibold hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 cursor-pointer flex items-center justify-between transition-all focus-visible:ring-1 focus-visible:ring-indigo-500 outline-none"
                        >
                          <div className="flex items-center gap-3">
                            {isTask && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTaskStatus(evt);
                                }}
                                className="shrink-0 text-zinc-400 hover:text-indigo-650"
                              >
                                <CheckCircle2 size={14} className={isCompleted ? "text-emerald-500" : ""} />
                              </button>
                            )}
                            {isMilestone && (
                              <Bookmark size={14} className="text-amber-500 shrink-0 fill-amber-500/10" />
                            )}
                            <div>
                              <div className={`font-bold ${isCompleted ? "line-through text-zinc-400" : "text-zinc-905 dark:text-zinc-50"}`}>
                                {evt.title}
                              </div>
                              {evt.description && (
                                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{evt.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-zinc-400">
                                <span className="flex items-center gap-1">
                                  <Clock size={9} />
                                  {new Date(evt.start_datetime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                  {" - "}
                                  {new Date(evt.end_datetime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span>•</span>
                                <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 dark:border-zinc-800/30 px-1.5 py-0.5 rounded text-[8px]">
                                  {evt.event_type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="planner-event-actions flex items-center gap-2 opacity-0 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForEdit(evt);
                                setIsEventDialogOpen(true);
                              }}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Edit"
                              aria-label="Edit Event"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickDuplicate(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Duplicate"
                              aria-label="Duplicate Event"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickArchive(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Archive"
                              aria-label="Archive Event"
                            >
                              <Archive size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickDeleteClick(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-250/20 hover:bg-red-500/10 text-zinc-450 hover:text-red-500 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-red-550"
                              title="Delete"
                              aria-label="Delete Event"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* D. AGENDA VIEW */}
            {viewMode === "agenda" && (
              <div className="flex-1 flex flex-col p-4 space-y-4">
                <div className="border-b border-zinc-100 dark:border-zinc-900 pb-3">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Planning Agenda</h3>
                  <p className="text-[10px] text-zinc-450">Chronological display of scheduled releases, tasks, and meetings.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 max-h-[450px]">
                  {events.length === 0 ? (
                    <div className="py-20 text-center text-xs text-zinc-400 font-semibold">
                      No agenda planning items scheduled.
                    </div>
                  ) : (
                    events.map((evt) => {
                      const isTask = String(evt.id).startsWith("task_");
                      const isCompleted = evt.task_status === "Completed";
                      const isMilestone = evt.event_type === "Milestone";
                      const dateObj = new Date(evt.start_datetime);
                      
                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setSelectedEventForEdit(evt);
                            setIsEventDialogOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedEventForEdit(evt);
                              setIsEventDialogOpen(true);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${evt.event_type} event: ${evt.title}`}
                          style={{ borderLeftColor: evt.color }}
                          className="planner-event-card p-3.5 rounded-xl border-l-3 bg-zinc-50/50 dark:bg-zinc-900/15 text-xs font-semibold hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 cursor-pointer flex items-center justify-between transition-all focus-visible:ring-1 focus-visible:ring-indigo-500 outline-none"
                        >
                          <div className="flex items-center gap-3.5">
                            {/* Date Badge */}
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl">
                              <span className="text-[8px] font-extrabold uppercase text-zinc-400 leading-none">
                                {dateObj.toLocaleDateString(undefined, { month: "short" })}
                              </span>
                              <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 leading-none mt-1">
                                {dateObj.getDate()}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {isTask && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTaskStatus(evt);
                                    }}
                                    className="shrink-0 text-zinc-400 hover:text-indigo-650"
                                  >
                                    <CheckCircle2 size={12} className={isCompleted ? "text-emerald-500" : ""} />
                                  </button>
                                )}
                                {isMilestone && (
                                  <Bookmark size={11} className="text-amber-500 shrink-0 fill-amber-500/10" />
                                )}
                                <span className={`font-bold ${isCompleted ? "line-through text-zinc-450" : "text-zinc-905 dark:text-zinc-50"}`}>
                                  {evt.title}
                                </span>
                              </div>
                              {evt.description && (
                                <p className="text-[10px] text-zinc-450 font-medium truncate max-w-sm">
                                  {evt.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[8px] text-zinc-400">
                                <span>
                                  {dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {evt.project_title && (
                                  <>
                                    <span>•</span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                                      {evt.project_title}
                                    </span>
                                  </>
                                )}
                                <span>•</span>
                                <span className="font-extrabold text-zinc-500 uppercase tracking-widest">
                                  {evt.event_type}
                                </span>
                              </div>
                            </div>
                                                    <div className="planner-event-actions flex items-center gap-2 opacity-0 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForEdit(evt);
                                setIsEventDialogOpen(true);
                              }}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Edit"
                              aria-label="Edit Event"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickDuplicate(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Duplicate"
                              aria-label="Duplicate Event"
                            >
                              <Copy size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickArchive(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-555 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              title="Archive"
                              aria-label="Archive Event"
                            >
                              <Archive size={11} />
                            </button>
                            <button
                              onClick={(e) => handleQuickDeleteClick(e, evt)}
                              className="w-7 h-7 rounded-lg border border-zinc-250/20 hover:bg-red-500/10 text-zinc-450 hover:text-red-500 flex items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-red-550"
                              title="Delete"
                              aria-label="Delete Event"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>  </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EVENT DIALOG COMPONENT */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => {
          setIsEventDialogOpen(false);
          setSelectedEventForEdit(null);
          setInitialDateForCreate("");
        }}
        onSubmit={handleEventDialogSubmit}
        event={selectedEventForEdit}
        initialProjectSlug={projectSlug}
        initialDate={initialDateForCreate}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setEventToDelete(null);
        }}
        projectName={eventToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />

      <style>{`
        .planner-event-card:hover .planner-event-actions {
          display: flex !important;
          opacity: 100 !important;
        }
      `}</style>
    </div>
  );
}
