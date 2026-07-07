"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Calendar, Clock, Link as LinkIcon, Folder, CheckSquare, Bell, Bookmark } from "lucide-react";
import { CreateEventInput, CalendarEvent, CalendarEventType } from "../types";
import { useProjectsQuery } from "../../projects";
import { useProjectTasksQuery } from "../../tasks";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string(),
  event_type: z.string(),
  project: z.string(),
  related_task: z.string(),
  start_datetime: z.string().min(1, "Start date/time is required"),
  end_datetime: z.string().min(1, "End date/time is required"),
  all_day: z.boolean(),
  color: z.string(),
  reminder_minutes: z.string(),
});

type FormInput = z.infer<typeof schema>;

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventInput) => Promise<void>;
  event?: CalendarEvent | null; // For editing
  initialProjectSlug?: string;
  initialDate?: string; // Tapped date (YYYY-MM-DD)
  loading?: boolean;
}

const formatToDateTimeLocal = (dateStr: string | null | undefined, defaultValue = "") => {
  if (!dateStr) return defaultValue;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return defaultValue;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function EventDialog({
  isOpen,
  onClose,
  onSubmit,
  event = null,
  initialProjectSlug = "",
  initialDate = "",
  loading = false,
}: EventDialogProps) {
  // Fetch active projects list for dropdown
  const { data: projectsData } = useProjectsQuery({ limit: 100 });
  const projects = projectsData?.results || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      event_type: "Content Plan",
      project: "none",
      related_task: "none",
      start_datetime: "",
      end_datetime: "",
      all_day: false,
      color: "#6366f1",
      reminder_minutes: "0",
    },
  });

  const selectedProjectSlugOrId = watch("project");
  
  // If the user selected a project, find its slug to load tasks
  const selectedProjectObj = projects.find(
    (p) => String(p.id) === selectedProjectSlugOrId || p.slug === selectedProjectSlugOrId
  );
  const projectSlugToLoadTasks = selectedProjectObj ? selectedProjectObj.slug : "";

  // Query project tasks
  const { data: projectTasks = [] } = useProjectTasksQuery(projectSlugToLoadTasks, !!projectSlugToLoadTasks);

  // Populate or reset form values
  useEffect(() => {
    if (isOpen) {
      if (event) {
        reset({
          title: event.title,
          description: event.description || "",
          event_type: event.event_type,
          project: event.project ? String(event.project) : "none",
          related_task: event.related_task ? String(event.related_task) : "none",
          start_datetime: formatToDateTimeLocal(event.start_datetime),
          end_datetime: formatToDateTimeLocal(event.end_datetime),
          all_day: event.all_day,
          color: event.color || "#6366f1",
          reminder_minutes: String(event.reminder_minutes || 0),
        });
      } else {
        const defaultStart = initialDate
          ? `${initialDate}T09:00`
          : formatToDateTimeLocal(new Date().toISOString());
        const defaultEnd = initialDate
          ? `${initialDate}T10:00`
          : formatToDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString());

        reset({
          title: "",
          description: "",
          event_type: "Content Plan",
          project: initialProjectSlug || "none",
          related_task: "none",
          start_datetime: defaultStart,
          end_datetime: defaultEnd,
          all_day: false,
          color: "#6366f1",
          reminder_minutes: "0",
        });
      }
    }
  }, [isOpen, event, reset, initialProjectSlug, initialDate]);

  // Set keyboard escape close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  const handleFormSubmit = async (data: FormInput) => {
    try {
      const projectVal = data.project === "none" || data.project === "" ? null : Number(data.project);
      const taskVal = data.related_task === "none" || data.related_task === "" ? null : Number(data.related_task);
      const reminderVal = data.reminder_minutes === "" ? 0 : Number(data.reminder_minutes);

      const submissionData: CreateEventInput = {
        title: data.title,
        description: data.description,
        event_type: data.event_type as CalendarEventType,
        project: projectVal,
        related_task: taskVal,
        start_datetime: new Date(data.start_datetime).toISOString(),
        end_datetime: new Date(data.end_datetime).toISOString(),
        all_day: data.all_day,
        color: data.color,
        reminder_minutes: reminderVal,
      };

      await onSubmit(submissionData);
      onClose();
    } catch (err) {
      console.error("Failed to submit event details:", err);
    }
  };

  const colors = [
    { label: "Indigo", hex: "#6366f1" },
    { label: "Emerald", hex: "#10b981" },
    { label: "Amber", hex: "#f59e0b" },
    { label: "Rose", hex: "#f43f5e" },
    { label: "Violet", hex: "#8b5cf6" },
    { label: "Sky", hex: "#0ea5e9" },
    { label: "Zinc", hex: "#71717a" },
  ];

  const eventTypes: CalendarEventType[] = [
    "Content Plan",
    "Task",
    "Milestone",
    "Meeting",
    "Reminder",
    "Personal",
  ];

  const selectedColor = watch("color");
  const selectedType = watch("event_type");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900/60 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/10">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
                    {event ? "Modify Calendar Event" : "Create Planning Event"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Organize your publishing, milestones, and tasks.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-8 h-8 rounded-xl border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 font-semibold">
              {/* Event Title */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                  Event Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Pinterest pins draft"
                  {...register("title")}
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                />
                {errors.title && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.title.message}</span>
                )}
              </div>

              {/* Event Type & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Event Type
                  </label>
                  <select
                    {...register("event_type")}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Color Accent
                  </label>
                  <div className="flex items-center h-10 gap-2 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl px-3 bg-zinc-50 dark:bg-zinc-900/60">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <select
                      {...register("color")}
                      className="bg-transparent text-xs w-full outline-none"
                    >
                      {colors.map((c) => (
                        <option key={c.hex} value={c.hex}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Project & Related Task */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Associated Project
                  </label>
                  <select
                    {...register("project")}
                    onChange={(e) => {
                      setValue("project", e.target.value);
                      setValue("related_task", "none"); // reset task when project changes
                    }}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  >
                    <option value="none">No Associated Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Linked Action Item
                  </label>
                  <select
                    {...register("related_task")}
                    disabled={selectedProjectSlugOrId === "none"}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all disabled:opacity-50"
                  >
                    <option value="none">No Linked Task</option>
                    {projectTasks.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start & End DateTimes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Start Date/Time
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="datetime-local"
                      {...register("start_datetime")}
                      className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                    />
                  </div>
                  {errors.start_datetime && (
                    <span className="text-[10px] text-red-500 mt-1 block">{errors.start_datetime.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    End Date/Time
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="datetime-local"
                      {...register("end_datetime")}
                      className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                    />
                  </div>
                  {errors.end_datetime && (
                    <span className="text-[10px] text-red-500 mt-1 block">{errors.end_datetime.message}</span>
                  )}
                </div>
              </div>

              {/* All day check & Reminder dropdown */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="all_day"
                    {...register("all_day")}
                    className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="all_day"
                    className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer selection:bg-transparent"
                  >
                    All Day Event
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                    Reminder Notification
                  </label>
                  <select
                    {...register("reminder_minutes")}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  >
                    <option value="0">At time of event</option>
                    <option value="5">5 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                    <option value="60">1 hour before</option>
                    <option value="1440">1 day before</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wider mb-1.5 dark:text-zinc-500">
                  Description
                </label>
                <textarea
                  placeholder="e.g. Include target keywords and outline pins template formats..."
                  rows={3}
                  {...register("description")}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-75 text-white font-bold text-xs shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : event ? (
                    "Save Changes"
                  ) : (
                    "Schedule Event"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
