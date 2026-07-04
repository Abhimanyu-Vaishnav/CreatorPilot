"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, Database, Pin, Star, Loader2, Link as LinkIcon } from "lucide-react";
import { KnowledgeItem, KnowledgeType } from "../types";
import { Note } from "../../notes/types";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string(),
  type: z.enum([
    "Research Note",
    "Website",
    "PDF",
    "Image",
    "Video Link",
    "Book",
    "Tutorial",
    "Checklist",
    "Snippet",
    "Document"
  ]),
  source_url: z.string().url("Invalid URL format").or(z.literal("")),
  tagsInput: z.string(),
  note_reference: z.string(),
  favorite: z.boolean(),
  pinned: z.boolean(),
});

type FormInput = z.infer<typeof schema>;

export const KNOWLEDGE_TYPE_OPTIONS: KnowledgeType[] = [
  "Research Note",
  "Website",
  "PDF",
  "Image",
  "Video Link",
  "Book",
  "Tutorial",
  "Checklist",
  "Snippet",
  "Document"
];

interface KnowledgeItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  item?: KnowledgeItem | null;
  notes?: Note[];
}

export function KnowledgeItemDialog({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  item = null,
  notes = [],
}: KnowledgeItemDialogProps) {
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
      type: "Document",
      source_url: "",
      tagsInput: "",
      note_reference: "",
      favorite: false,
      pinned: false,
    },
  });

  const isFavorite = watch("favorite");
  const isPinned = watch("pinned");
  const selectedType = watch("type");

  // Reset form when dialog opens or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          title: item.title || "",
          description: item.description || "",
          type: item.type || "Document",
          source_url: item.source_url || "",
          tagsInput: item.tags ? item.tags.join(", ") : "",
          note_reference: item.note_reference ? String(item.note_reference) : "",
          favorite: item.favorite || false,
          pinned: item.pinned || false,
        });
      } else {
        reset({
          title: "",
          description: "",
          type: "Document",
          source_url: "",
          tagsInput: "",
          note_reference: "",
          favorite: false,
          pinned: false,
        });
      }
    }
  }, [isOpen, item, reset]);

  // Listen for Escape key
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
      const parsedTags = data.tagsInput
        ? data.tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      
      const payload = {
        title: data.title,
        description: data.description,
        type: data.type,
        source_url: data.source_url || null,
        note_reference: data.note_reference ? Number(data.note_reference) : null,
        tags: parsedTags,
        favorite: data.favorite,
        pinned: data.pinned,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Failed to save knowledge item:", error);
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
            className="relative w-full max-w-lg rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Database size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    {item ? "Edit Knowledge Resource" : "Add Knowledge Resource"}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                    {item ? "Modify this research item" : "Store articles, links, PDFs or notes in your vault"}
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
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Django DDD Architecture Guide"
                  {...register("title")}
                  className="w-full h-9 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                />
                {errors.title && (
                  <p className="text-[10px] text-rose-500 font-bold">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary, notes, or key findings..."
                  {...register("description")}
                  className="w-full rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50 resize-none"
                />
              </div>

              {/* Type and Link Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Resource Type
                  </label>
                  <select
                    {...register("type")}
                    className="w-full h-9 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                  >
                    {KNOWLEDGE_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t} className="dark:bg-[#0c0c0f]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Source URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/article"
                    {...register("source_url")}
                    className="w-full h-9 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                  />
                  {errors.source_url && (
                    <p className="text-[10px] text-rose-500 font-bold">{errors.source_url.message}</p>
                  )}
                </div>
              </div>

              {/* Tags & Note Linkage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="research, architecture, guide"
                    {...register("tagsInput")}
                    className="w-full h-9 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Link to Note (Optional)
                  </label>
                  <select
                    {...register("note_reference")}
                    className="w-full h-9 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-3 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:text-zinc-50"
                  >
                    <option value="" className="dark:bg-[#0c0c0f]">Select a note...</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id} className="dark:bg-[#0c0c0f]">
                        {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Favorite & Pin switches */}
              <div className="flex items-center gap-6 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setValue("favorite", !isFavorite)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                    isFavorite
                      ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Star size={13} className={isFavorite ? "fill-amber-500" : ""} />
                  {isFavorite ? "Starred Favorite" : "Star Favorite"}
                </button>

                <button
                  type="button"
                  onClick={() => setValue("pinned", !isPinned)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                    isPinned
                      ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <Pin size={13} className={isPinned ? "fill-indigo-500" : ""} />
                  {isPinned ? "Pinned to Top" : "Pin to Top"}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-9 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Resource"
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
