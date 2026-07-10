"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Star,
  Archive,
  Trash2,
  Copy,
  Clock,
  HardDrive,
  File,
  FileText,
  Link as LinkIcon,
  Tag,
  Eye,
  Download,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { MediaAsset } from "../types";
import { useUpdateMediaMutation, useDuplicateMediaMutation, useDeleteMediaMutation } from "../hooks/useMedia";
import { useProjectDocumentsQuery } from "../../studio/hooks/useDocuments";

interface MediaDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  projectSlug: string;
}

export function MediaDetailsDialog({
  isOpen,
  onClose,
  asset,
  projectSlug,
}: MediaDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [relatedDocId, setRelatedDocId] = useState("");

  const updateMutation = useUpdateMediaMutation(projectSlug);
  const duplicateMutation = useDuplicateMediaMutation(projectSlug);
  const deleteMutation = useDeleteMediaMutation(projectSlug);

  // Get project documents for linking dropdown
  const { data: documents = [] } = useProjectDocumentsQuery(projectSlug);
  const activeDocuments = documents.filter((d) => !d.archived);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || "");
      setDescription(asset.description || "");
      setTagsInput(asset.tags ? asset.tags.join(", ") : "");
      setRelatedDocId(asset.related_document ? String(asset.related_document) : "");
      setIsEditing(false);
    }
  }, [asset, isOpen]);

  if (!asset) return null;

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedTags = tagsInput
        ? tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      await updateMutation.mutateAsync({
        slug: asset.slug,
        data: {
          title,
          description,
          tags: parsedTags,
          related_document: relatedDocId ? Number(relatedDocId) : null,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update media details", err);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: asset.slug,
        data: { favorite: !asset.favorite },
      });
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const handleToggleArchive = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: asset.slug,
        data: { archived: !asset.archived },
      });
      onClose();
    } catch (err) {
      console.error("Failed to toggle archive", err);
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateMutation.mutateAsync(asset.slug);
      onClose();
    } catch (err) {
      console.error("Failed to duplicate asset", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this media asset? This will also remove the uploaded file from the storage directory.")) {
      try {
        await deleteMutation.mutateAsync(asset.slug);
        onClose();
      } catch (err) {
        console.error("Failed to delete asset", err);
      }
    }
  };

  // Render preview component based on asset type
  const renderPreview = () => {
    const fileUrl = asset.file_url;
    if (!fileUrl) return null;

    switch (asset.asset_type) {
      case "Image":
      case "Thumbnail":
      case "Logo":
        return (
          <div className="w-full flex items-center justify-center p-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl overflow-hidden min-h-[220px]">
            <img
              src={fileUrl}
              alt={asset.title}
              className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm"
              loading="lazy"
            />
          </div>
        );
      case "Video":
        return (
          <div className="w-full flex items-center justify-center p-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl overflow-hidden">
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-[300px] rounded-lg shadow-sm"
            />
          </div>
        );
      case "Audio":
        return (
          <div className="w-full p-6 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <HardDrive size={22} className="animate-pulse" />
            </div>
            <audio src={fileUrl} controls className="w-full max-w-sm" />
          </div>
        );
      case "PDF":
        return (
          <div className="w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <iframe
              src={`${fileUrl}#toolbar=0`}
              className="w-full h-[320px] bg-white dark:bg-[#0c0c0f]"
              title={asset.title}
            />
          </div>
        );
      default:
        return (
          <div className="w-full py-12 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl flex flex-col items-center justify-center text-center gap-3 border border-dashed border-zinc-200 dark:border-zinc-850 p-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-650 shadow-inner">
              <File size={26} />
            </div>
            <div>
              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-xs">{asset.file_name}</p>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1 uppercase tracking-wider">{asset.mime_type}</p>
            </div>
            <a
              href={fileUrl}
              download={asset.file_name}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors mt-1"
            >
              <Download size={12} />
              Download File Reference
            </a>
          </div>
        );
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
            className="relative w-full max-w-2xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-2xl p-6 overflow-hidden z-10 font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ImageIcon size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                    {asset.title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-medium truncate flex items-center gap-1">
                    <span>{asset.asset_type}</span>
                    <span>•</span>
                    <span className="font-mono">{asset.file_name}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleFavorite}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Star Favorite"
                >
                  <Star size={15} className={asset.favorite ? "text-amber-500 fill-amber-500" : ""} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 h-[460px] overflow-y-auto pr-1">
              
              {/* Left Column: Preview (span 3) */}
              <div className="md:col-span-3 space-y-4">
                <div className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Asset Preview</div>
                {renderPreview()}
                
                {asset.description && !isEditing && (
                  <div className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 text-xs">
                    <p className="font-bold text-zinc-500 mb-1">Description</p>
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed whitespace-pre-line">{asset.description}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Details & Edit Forms (span 2) */}
              <div className="md:col-span-2 space-y-5 flex flex-col justify-between">
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider">Asset Details</div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-[10px] text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 font-bold transition-colors cursor-pointer"
                    >
                      {isEditing ? "Cancel" : "Edit Metadata"}
                    </button>
                  </div>

                  {isEditing ? (
                    /* Edit Form */
                    <form onSubmit={handleUpdateDetails} className="space-y-3.5 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-450 uppercase tracking-wider">Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-450 uppercase tracking-wider">Description</label>
                        <textarea
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-450 uppercase tracking-wider">Link Document</label>
                        <select
                          value={relatedDocId}
                          onChange={(e) => setRelatedDocId(e.target.value)}
                          className="w-full h-8 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                        >
                          <option value="">No linked document</option>
                          {activeDocuments.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-450 uppercase tracking-wider">Tags</label>
                        <input
                          type="text"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="w-full h-8 mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center shadow transition-all cursor-pointer"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Metadata"}
                      </button>
                    </form>
                  ) : (
                    /* Read-only Metadata Details */
                    <div className="space-y-3 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                      
                      {/* File format & Size */}
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><HardDrive size={11} /> File Size</span>
                        <span className="font-mono">{formatBytes(asset.file_size)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><FileText size={11} /> MIME Type</span>
                        <span className="font-mono truncate max-w-[120px]" title={asset.mime_type}>{asset.mime_type}</span>
                      </div>

                      {/* Timeline details */}
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><Clock size={11} /> Uploaded</span>
                        <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><Clock size={11} /> Opened</span>
                        <span>{asset.last_opened_at ? new Date(asset.last_opened_at).toLocaleDateString() : "Never"}</span>
                      </div>

                      {/* Project and document linkages */}
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><LinkIcon size={11} /> Project</span>
                        <span className="truncate max-w-[130px] font-bold text-indigo-650 dark:text-indigo-400">{asset.project_title}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/50">
                        <span className="text-zinc-450 flex items-center gap-1"><LinkIcon size={11} /> Document</span>
                        <span className="truncate max-w-[130px]" title={asset.related_document_title || "Unlinked"}>
                          {asset.related_document_title || (
                            <span className="text-zinc-400 italic">None linked</span>
                          )}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-zinc-450 flex items-center gap-1"><Tag size={11} /> Tags</span>
                        {asset.tags && asset.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {asset.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-bold"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[10px] block">No tags added</span>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* Operations & Quick Actions (Sticky at bottom of column) */}
                <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800 space-y-2">
                  <div className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Workspace Actions</div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDuplicate}
                      disabled={duplicateMutation.isPending}
                      className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={11} className="text-zinc-450" />
                      Duplicate Metadata
                    </button>
                    
                    <button
                      onClick={handleToggleArchive}
                      className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Archive size={11} className="text-zinc-450" />
                      {asset.archived ? "Restore Asset" : "Archive Asset"}
                    </button>
                  </div>

                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full h-8 rounded-lg border border-rose-500/10 hover:bg-rose-500/5 text-rose-500 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={11} />
                    Delete Asset Permanently
                  </button>
                </div>

              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
