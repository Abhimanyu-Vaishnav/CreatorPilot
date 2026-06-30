"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, Folder, Video, FileText, Calendar, Globe, Sparkles, Loader2, Star, Archive } from "lucide-react";
import { Project, CreateProjectInput } from "../types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(1000, "Description is too long"),
  category: z.string().min(1, "Category is required").max(50, "Category is too long"),
  status: z.enum(["Planning", "In Progress", "Completed", "Paused"]),
  color: z.string(),
  icon: z.string(),
  template: z.string(),
  favorite: z.boolean(),
  archived: z.boolean(),
  project_progress: z.number().min(0).max(100),
});

type FormInput = z.infer<typeof schema>;

export const COLOR_OPTIONS = [
  { name: "Indigo", hex: "#6366f1", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500/30" },
  { name: "Emerald", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/30" },
  { name: "Violet", hex: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500/30" },
  { name: "Rose", hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/30" },
  { name: "Amber", hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/30" },
  { name: "Sky", hex: "#0ea5e9", bg: "bg-sky-500", text: "text-sky-500", border: "border-sky-500/30" },
];

export const ICON_OPTIONS = [
  { name: "Folder", icon: Folder },
  { name: "Video", icon: Video },
  { name: "Writing", icon: FileText },
  { name: "Calendar", icon: Calendar },
  { name: "Web", icon: Globe },
  { name: "Sparkles", icon: Sparkles },
];

export function ProjectIcon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  switch (name) {
    case "Video": return <Video size={size} className={className} />;
    case "Writing": return <FileText size={size} className={className} />;
    case "Calendar": return <Calendar size={size} className={className} />;
    case "Web": return <Globe size={size} className={className} />;
    case "Sparkles": return <Sparkles size={size} className={className} />;
    default: return <Folder size={size} className={className} />;
  }
}

export const TEMPLATE_PRESETS: Record<string, { icon: string; color: string; category: string }> = {
  Blank: { icon: "Folder", color: "#6366f1", category: "General" },
  YouTube: { icon: "Video", color: "#f43f5e", category: "YouTube" },
  Pinterest: { icon: "Calendar", color: "#f43f5e", category: "Pinterest" },
  Blog: { icon: "Writing", color: "#10b981", category: "Blog" },
  Client: { icon: "Calendar", color: "#0ea5e9", category: "Client" },
  Course: { icon: "Sparkles", color: "#8b5cf6", category: "Course" },
};

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
  project?: Project | null;
  loading?: boolean;
}

export function ProjectDialog({ isOpen, onClose, onSubmit, project = null, loading = false }: ProjectDialogProps) {
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
      category: "General",
      status: "Planning",
      color: "#6366f1",
      icon: "Folder",
      template: "Blank",
      favorite: false,
      archived: false,
      project_progress: 0,
    },
  });

  const selectedColor = watch("color");
  const selectedIcon = watch("icon");
  const selectedTemplate = watch("template") || "Blank";
  const isFavorite = watch("favorite");
  const isArchived = watch("archived");

  const handleTemplateChange = (tmpl: string) => {
    setValue("template", tmpl);
    const preset = TEMPLATE_PRESETS[tmpl];
    if (preset) {
      setValue("icon", preset.icon);
      setValue("color", preset.color);
      setValue("category", preset.category);
    }
  };

  // Sync with project data if editing
  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        color: project.color,
        icon: project.icon,
        template: project.template || "Blank",
        favorite: project.favorite,
        archived: project.archived,
        project_progress: project.project_progress ?? 0,
      });
    } else {
      reset({
        title: "",
        description: "",
        category: "General",
        status: "Planning",
        color: "#6366f1",
        icon: "Folder",
        template: "Blank",
        favorite: false,
        archived: false,
        project_progress: 0,
      });
    }
  }, [project, reset, isOpen]);

  const handleFormSubmit = async (data: FormInput) => {
    try {
      await onSubmit(data as CreateProjectInput);
      onClose();
    } catch (error) {
      console.error("Form submit error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                  {project ? "Edit Project" : "Create New Project"}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {project ? "Update details for this creative module." : "Start a new bounded context for digital creation."}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Template Select */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Project Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all font-semibold"
                >
                  <option value="Blank">Blank (Default)</option>
                  <option value="YouTube">YouTube Preset (Rose, Video, Category: YouTube)</option>
                  <option value="Pinterest">Pinterest Preset (Rose, Calendar, Category: Pinterest)</option>
                  <option value="Blog">Blog Preset (Emerald, Writing, Category: Blog)</option>
                  <option value="Client">Client Preset (Sky, Calendar, Category: Client)</option>
                  <option value="Course">Course Preset (Violet, Sparkles, Category: Course)</option>
                </select>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Project Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NextGen YouTube Vlog"
                    {...register("title")}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                  {errors.title && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="General"
                    {...register("category")}
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                  {errors.category && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.category.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Outline the goals, milestones, or channel targeting for this project..."
                  rows={3}
                  {...register("description")}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all resize-none"
                />
                {errors.description && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.description.message}</p>
                )}
              </div>

              {/* Status & Options & Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all font-semibold"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>

                {/* Inline Options (Toggles) */}
                <div className="flex items-center gap-4 pt-5">
                  <button
                    type="button"
                    onClick={() => setValue("favorite", !isFavorite)}
                    className={`flex-1 h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      isFavorite
                        ? "bg-amber-500/10 border-amber-500/35 text-amber-600 dark:text-amber-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <Star size={14} className={isFavorite ? "fill-amber-500" : ""} />
                    Favorite
                  </button>

                  <button
                    type="button"
                    onClick={() => setValue("archived", !isArchived)}
                    className={`flex-1 h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      isArchived
                        ? "bg-zinc-500/10 border-zinc-500/35 text-zinc-600 dark:text-zinc-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Project Progress
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {watch("project_progress") || 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  {...register("project_progress", { valueAsNumber: true })}
                  className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Theme Accent Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_OPTIONS.map((c) => {
                    const isSelected = selectedColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setValue("color", c.hex)}
                        className={`w-7 h-7 rounded-full ${c.bg} transition-all relative flex items-center justify-center`}
                      >
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                        <span
                          className={`absolute inset-[-3px] rounded-full border-2 ${
                            isSelected ? "border-zinc-950 dark:border-zinc-200" : "border-transparent"
                          } transition-all`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Project Workspace Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((ico) => {
                    const IconComponent = ico.icon;
                    const isSelected = selectedIcon === ico.name;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => setValue("icon", ico.name)}
                        className={`h-10 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold"
                            : "border-zinc-200/60 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        }`}
                        title={ico.name}
                      >
                        <IconComponent size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{project ? "Save Changes" : "Create Project"}</>
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
