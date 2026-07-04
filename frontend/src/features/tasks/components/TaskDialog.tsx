"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckSquare, Loader2, Calendar, Clock, Link as LinkIcon, FileText, Database } from "lucide-react";
import { CreateTaskInput, Task, TaskStatus, TaskPriority } from "../types";
import { useProjectNotesQuery } from "../../notes";
import { useProjectKnowledgeQuery } from "../../vault";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  start_date: z.string(),
  due_date: z.string(),
  estimated_time: z.string(),
  related_note: z.string(),
  related_knowledge: z.string(),
});

type FormInput = z.infer<typeof schema>;

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateTaskInput, "project">) => Promise<void>;
  projectSlug: string;
  task?: Task | null; // For editing
  loading?: boolean;
}

const formatToDateTimeLocal = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function TaskDialog({ isOpen, onClose, onSubmit, projectSlug, task = null, loading = false }: TaskDialogProps) {
  const { data: notes = [] } = useProjectNotesQuery(projectSlug, isOpen);
  const { data: knowledge = [] } = useProjectKnowledgeQuery(projectSlug, undefined, isOpen);

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
      status: "Todo",
      priority: "Medium",
      start_date: "",
      due_date: "",
      estimated_time: "0",
      related_note: "none",
      related_knowledge: "none",
    },
  });

  // Populate form values for editing or reset on open
  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          start_date: formatToDateTimeLocal(task.start_date),
          due_date: formatToDateTimeLocal(task.due_date),
          estimated_time: task.estimated_time ? String(task.estimated_time) : "0",
          related_note: task.related_note ? String(task.related_note) : "none",
          related_knowledge: task.related_knowledge ? String(task.related_knowledge) : "none",
        });
      } else {
        reset({
          title: "",
          description: "",
          status: "Todo",
          priority: "Medium",
          start_date: "",
          due_date: "",
          estimated_time: "0",
          related_note: "none",
          related_knowledge: "none",
        });
      }
    }
  }, [isOpen, task, reset]);

  // Escape key close listener
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
      const estimated_time = data.estimated_time === "" ? 0 : Number(data.estimated_time);
      const related_note = data.related_note === "none" || data.related_note === "" ? null : Number(data.related_note);
      const related_knowledge = data.related_knowledge === "none" || data.related_knowledge === "" ? null : Number(data.related_knowledge);
      
      const submissionData = {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        estimated_time,
        related_note,
        related_knowledge,
      };
      await onSubmit(submissionData);
      onClose();
    } catch (err) {
      console.error("Failed to submit task dialog:", err);
    }
  };

  const selectedStatus = watch("status");
  const selectedPriority = watch("priority");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[3px]"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center">
                  <CheckSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    {task ? "Edit Task" : "Create New Task"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                    {task ? "Update the details of this task" : "Add an actionable task to your project"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4 font-semibold text-zinc-700 dark:text-zinc-300">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule YouTube upload"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Describe the task objective, deliverables, or checklist items..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all resize-none font-semibold"
                  {...register("description")}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                    {...register("status")}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                    {...register("priority")}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Dates and Estimate */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar size={11} /> Start Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full h-10 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                    {...register("start_date")}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar size={11} /> Due Date
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full h-10 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                    {...register("due_date")}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock size={11} /> Est. Time (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                    {...register("estimated_time")}
                  />
                </div>
              </div>

              {/* Resource Cross-Linking */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900/60 space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <LinkIcon size={11} /> Resource Cross-Linking (Optional)
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                      <FileText size={10} /> Link Note
                    </label>
                    <select
                      className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                      {...register("related_note")}
                    >
                      <option value="none">No note linked</option>
                      {notes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                      <Database size={10} /> Link Knowledge
                    </label>
                    <select
                      className="w-full h-9 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                      {...register("related_knowledge")}
                    >
                      <option value="none">No knowledge linked</option>
                      {knowledge.map((k) => (
                        <option key={k.id} value={k.id}>
                          [{k.type}] {k.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900/60 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-75 text-white text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    task ? "Save Changes" : "Create Task"
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
