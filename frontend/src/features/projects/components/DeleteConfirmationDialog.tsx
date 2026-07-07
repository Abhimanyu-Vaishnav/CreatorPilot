"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
  loading?: boolean;
  title?: string;
  confirmText?: string;
  description?: string;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  loading = false,
  title = "Delete Project",
  confirmText = "Delete Project",
  description,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete confirmation error:", error);
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/10 dark:border-rose-500/15 bg-white dark:bg-[#0c0c0f] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-rose-500/5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
                <p className="text-[10px] text-rose-500 mt-0.5 font-medium">This action cannot be undone.</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                {description || (
                  <>
                    Are you sure you want to delete <span className="font-bold text-zinc-900 dark:text-zinc-100">"{projectName}"</span>? All files, content plans, and channels configured within this bounded context will be detached.
                  </>
                )}
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/10">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 text-white font-semibold text-xs shadow-md shadow-rose-600/10 flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
