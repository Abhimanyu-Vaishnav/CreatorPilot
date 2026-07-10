"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, UploadCloud, File, AlertCircle, RefreshCw, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { UploadTask } from "../hooks/useUploadQueue";

interface MediaUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  queue: UploadTask[];
  addFilesToQueue: (files: FileList | File[]) => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => void;
  clearCompleted: () => void;
}

export function MediaUploadDialog({
  isOpen,
  onClose,
  queue,
  addFilesToQueue,
  cancelTask,
  retryTask,
  clearCompleted,
}: MediaUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      addFilesToQueue(e.target.files);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
            className="relative w-full max-w-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UploadCloud size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-550">
                    Upload Media Queue
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-semibold">
                    Upload multiple files simultaneously. Max file size: 50MB.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* File Drag Zone */}
            <div className="mt-4 space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`w-full py-8 border-2 border-dashed rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10 flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <UploadCloud size={32} className="text-zinc-400 group-hover:text-indigo-650 transition-colors" />
                <div className="text-center">
                  <p className="font-bold text-zinc-850 dark:text-zinc-250 text-xs">
                    Drag and drop your assets here, or <span className="text-indigo-600 dark:text-indigo-400">browse files</span>
                  </p>
                  <p className="text-[9px] text-zinc-450 mt-1">Supports images, video, audio, PDFs, documents, archives</p>
                </div>
              </div>

              {/* Upload Queue List */}
              {queue.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    <span>Queue ({queue.length} files)</span>
                    <button
                      type="button"
                      onClick={clearCompleted}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={10} /> Clear Completed
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                    {queue.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-55/20 dark:bg-zinc-900/20 text-xs flex flex-col gap-2 font-semibold"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-900/60 flex items-center justify-center text-zinc-455 shrink-0">
                              <File size={12} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-850 dark:text-zinc-150 truncate text-[11px] leading-tight" title={task.name}>
                                {task.name}
                              </p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{formatBytes(task.size)}</p>
                            </div>
                          </div>

                          {/* Status badge and actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {task.status === "uploading" && (
                              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                <Loader2 size={10} className="animate-spin" />
                                <span>{task.progress}%</span>
                                <button
                                  type="button"
                                  onClick={() => cancelTask(task.id)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-0.5 rounded transition-all cursor-pointer"
                                  title="Cancel Upload"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )}

                            {task.status === "queued" && (
                              <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-450 px-1.5 py-0.5 rounded">
                                Queued
                              </span>
                            )}

                            {task.status === "completed" && (
                              <span className="text-[9px] text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Done
                              </span>
                            )}

                            {task.status === "failed" && (
                              <div className="flex items-center gap-1 text-[9px] text-rose-550">
                                <AlertCircle size={10} />
                                <span>Failed</span>
                                <button
                                  type="button"
                                  onClick={() => retryTask(task.id)}
                                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                                  title="Retry Upload"
                                >
                                  <RefreshCw size={8} />
                                </button>
                              </div>
                            )}

                            {task.status === "cancelled" && (
                              <div className="flex items-center gap-1 text-[9px] text-zinc-400">
                                <span>Cancelled</span>
                                <button
                                  type="button"
                                  onClick={() => retryTask(task.id)}
                                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 hover:text-zinc-700 rounded cursor-pointer"
                                  title="Retry Upload"
                                >
                                  <RefreshCw size={8} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {task.status === "uploading" && (
                          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-indigo-650 h-full transition-all duration-150"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}

                        {/* Error info */}
                        {task.error && (
                          <p className="text-[9px] text-rose-500 font-medium leading-tight">{task.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/80 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-900/60 font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Queue
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
