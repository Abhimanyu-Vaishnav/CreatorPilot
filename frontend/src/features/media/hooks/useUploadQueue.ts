"use client";

import { useState, useRef, useCallback } from "react";
import { mediaService } from "../services/media";

export interface UploadTask {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed" | "cancelled";
  error: string | null;
  file: File;
  cancelRef: { abort?: () => void };
}

export function useUploadQueue(projectSlug?: string, projectId?: number, currentFolderId?: number | null) {
  const [queue, setQueue] = useState<UploadTask[]>([]);
  const activeUploadsCount = useRef(0);
  const maxConcurrent = 2; // Process 2 uploads concurrently

  const processNext = useCallback((currentQueue: UploadTask[]) => {
    const uploadingCount = currentQueue.filter(t => t.status === "uploading").length;
    if (uploadingCount >= maxConcurrent) return;

    const nextTask = currentQueue.find(t => t.status === "queued");
    if (!nextTask) return;

    // Start upload
    setQueue(prev =>
      prev.map(t => (t.id === nextTask.id ? { ...t, status: "uploading" as const } : t))
    );

    const formData = new FormData();
    formData.append("file", nextTask.file);
    formData.append("project", String(projectId));
    formData.append("title", nextTask.name.substring(0, nextTask.name.lastIndexOf('.')) || nextTask.name);
    
    // Auto detect type
    const mime = nextTask.file.type.toLowerCase();
    const name = nextTask.file.name.toLowerCase();
    let detectedType = "Other";
    if (mime.startsWith("image/")) {
      detectedType = name.includes("logo") ? "Logo" : name.includes("thumb") ? "Thumbnail" : "Image";
    } else if (mime.startsWith("video/")) {
      detectedType = "Video";
    } else if (mime.startsWith("audio/")) {
      detectedType = "Audio";
    } else if (mime === "application/pdf") {
      detectedType = "PDF";
    } else if (mime.includes("document") || mime.includes("text/") || name.endsWith(".md") || name.endsWith(".txt")) {
      detectedType = "Document";
    }
    formData.append("asset_type", detectedType);

    if (currentFolderId) {
      formData.append("folder", String(currentFolderId));
    }

    const cancelRef: { abort?: () => void } = {};
    nextTask.cancelRef.abort = () => {
      if (cancelRef.abort) cancelRef.abort();
    };

    mediaService.uploadMediaAssetWithProgress(
      formData,
      (percent) => {
        setQueue(prev =>
          prev.map(t => (t.id === nextTask.id ? { ...t, progress: percent } : t))
        );
      },
      cancelRef
    )
      .then(() => {
        setQueue(prev => {
          const updated = prev.map(t =>
            t.id === nextTask.id ? { ...t, status: "completed" as const, progress: 100 } : t
          );
          setTimeout(() => processNext(updated), 50);
          return updated;
        });
      })
      .catch((err) => {
        const errorMsg = err?.file?.[0] || err?.detail || err?.message || "Upload failed";
        setQueue(prev => {
          const updated = prev.map(t =>
            t.id === nextTask.id ? { ...t, status: t.status === "cancelled" ? ("cancelled" as const) : ("failed" as const), error: errorMsg } : t
          );
          setTimeout(() => processNext(updated), 50);
          return updated;
        });
      });
  }, [projectId, currentFolderId]);

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const newTasks = Array.from(files).map((file) => {
      const task: UploadTask = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "queued",
        error: null,
        file: file,
        cancelRef: {}
      };
      return task;
    });

    setQueue(prev => {
      const nextQueue = [...prev, ...newTasks];
      // Trigger uploads
      setTimeout(() => processNext(nextQueue), 50);
      return nextQueue;
    });
  }, [processNext]);

  const cancelTask = useCallback((taskId: string) => {
    setQueue(prev => {
      const task = prev.find(t => t.id === taskId);
      if (task) {
        if (task.cancelRef.abort) {
          task.cancelRef.abort();
        }
      }
      return prev.map(t => (t.id === taskId ? { ...t, status: "cancelled" as const, progress: 0 } : t));
    });
  }, []);

  const retryTask = useCallback((taskId: string) => {
    setQueue(prev => {
      const updated = prev.map(t => (t.id === taskId ? { ...t, status: "queued" as const, progress: 0, error: null } : t));
      setTimeout(() => processNext(updated), 50);
      return updated;
    });
  }, [processNext]);

  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(t => t.status !== "completed"));
  }, []);

  return {
    queue,
    addFilesToQueue,
    cancelTask,
    retryTask,
    clearCompleted,
  };
}
