"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, HelpCircle, AlertCircle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  loading = false,
}: ConfirmationDialogProps) {
  
  // Listen for Escape key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loading]);

  const getThemeConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertCircle,
          iconColor: "text-rose-500",
          iconBg: "bg-rose-500/10 border-rose-500/10",
          buttonBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10",
        };
      case "info":
        return {
          icon: HelpCircle,
          iconColor: "text-indigo-500",
          iconBg: "bg-indigo-500/10 border-indigo-500/10",
          buttonBg: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10",
        };
      default: // warning
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-500",
          iconBg: "bg-amber-500/10 border-amber-500/10",
          buttonBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10",
        };
    }
  };

  const theme = getThemeConfig();
  const Icon = theme.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-[2px]"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-sm rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-5 overflow-hidden z-10 font-sans"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-desc"
          >
            {/* Header Content */}
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${theme.iconBg}`}>
                <Icon size={18} className={theme.iconColor} />
              </div>
              <div className="space-y-1.5 flex-1 pr-6">
                <h3 id="dialog-title" className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
                  {title}
                </h3>
                <p id="dialog-desc" className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
                  {description}
                </p>
              </div>
              
              {!loading && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-900/60 font-semibold text-xs">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors text-zinc-600 dark:text-zinc-400 disabled:opacity-60"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onConfirm();
                    onClose();
                  } catch (err) {
                    console.error("Confirmation error:", err);
                  }
                }}
                disabled={loading}
                className={`h-9 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${theme.buttonBg} disabled:opacity-60`}
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Processing...
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
