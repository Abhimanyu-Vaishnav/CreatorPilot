"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText, Pin, Star, Loader2, Check } from "lucide-react";
import { CreateNoteInput } from "../types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  color: z.string(),
  template: z.string(),
  favorite: z.boolean(),
  pinned: z.boolean(),
});

type FormInput = z.infer<typeof schema>;

export const NOTE_COLOR_OPTIONS = [
  { name: "Indigo", hex: "#6366f1", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500/30" },
  { name: "Emerald", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/30" },
  { name: "Violet", hex: "#8b5cf6", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500/30" },
  { name: "Rose", hex: "#f43f5e", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500/30" },
  { name: "Amber", hex: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/30" },
  { name: "Sky", hex: "#0ea5e9", bg: "bg-sky-500", text: "text-sky-500", border: "border-sky-500/30" },
];

export const NOTE_TEMPLATE_OPTIONS = [
  { name: "Blank", desc: "Start from scratch" },
  { name: "Meeting Notes", desc: "Log agendas, attendees & action items" },
  { name: "Research", desc: "Structure objectives, findings & sources" },
  { name: "Blog Draft", desc: "SEO outline and draft writing" },
  { name: "YouTube Script", desc: "Video hook, outline & storyboard draft" },
  { name: "Pinterest Ideas", desc: "Keywords, theme & pins organizer" },
  { name: "Checklist", desc: "Simple action list with checkboxes" },
];

interface NoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateNoteInput, "project">) => Promise<void>;
  loading?: boolean;
}

export function NoteDialog({ isOpen, onClose, onSubmit, loading = false }: NoteDialogProps) {
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
      color: "#6366f1",
      template: "Blank",
      favorite: false,
      pinned: false,
    },
  });

  const selectedColor = watch("color");
  const selectedTemplate = watch("template");
  const isFavorite = watch("favorite");
  const isPinned = watch("pinned");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        title: "",
        color: "#6366f1",
        template: "Blank",
        favorite: false,
        pinned: false,
      });
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: FormInput) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

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

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Create New Note</h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Add a note workspace to this project</p>
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
              {/* Title input */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Note Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. YouTube Script Draft"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-zinc-950 transition-all font-semibold"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.title.message}</p>
                )}
              </div>

              {/* Accent Color selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Accent Color Theme
                </label>
                <div className="flex items-center gap-3">
                  {NOTE_COLOR_OPTIONS.map((opt) => {
                    const isSelected = selectedColor === opt.hex;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setValue("color", opt.hex)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${opt.bg} hover:scale-110 shadow-sm relative`}
                        title={opt.name}
                      >
                        {isSelected && (
                          <Check size={12} className="text-white font-bold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preset Template select */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Content Template Preset
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1 border border-zinc-100 dark:border-zinc-900 p-1.5 rounded-xl bg-zinc-50/40 dark:bg-zinc-900/10">
                  {NOTE_TEMPLATE_OPTIONS.map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.name;
                    return (
                      <button
                        key={tmpl.name}
                        type="button"
                        onClick={() => setValue("template", tmpl.name)}
                        className={`flex flex-col items-start px-3 py-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-white dark:bg-[#131317] border border-indigo-600/30 dark:border-indigo-500/30 shadow-sm"
                            : "border border-transparent hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                        }`}
                      >
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {tmpl.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </span>
                        <span className="text-[10px] text-zinc-400 mt-0.5 leading-normal">{tmpl.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pin & Favorite state toggles */}
              <div className="flex gap-4 pt-1.5 border-t border-zinc-100 dark:border-zinc-900/60">
                <button
                  type="button"
                  onClick={() => setValue("favorite", !isFavorite)}
                  className={`flex-1 h-9 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    isFavorite
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Star size={14} className={isFavorite ? "fill-amber-500 text-amber-500" : ""} />
                  {isFavorite ? "Starred" : "Star Note"}
                </button>

                <button
                  type="button"
                  onClick={() => setValue("pinned", !isPinned)}
                  className={`flex-1 h-9 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    isPinned
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Pin size={14} className={isPinned ? "text-indigo-500 fill-indigo-500/10" : ""} />
                  {isPinned ? "Pinned" : "Pin Note"}
                </button>
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
                  className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 text-white text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Note"
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
