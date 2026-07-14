import React, { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { PublishItem, CreatePublishItemInput, UpdatePublishItemInput } from "../types";
import { usePlatformsQuery } from "../hooks/usePublishing";
import { useProjectsQuery } from "../../projects";
import { useDocumentsQuery } from "../../studio/hooks/useDocuments";
import { useMediaQuery } from "../../media/hooks/useMedia";
import { SEOCard } from "./SEOCard";

interface PublishingEditorProps {
  item: PublishItem | null;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function PublishingEditor({ item, onSave, onCancel }: PublishingEditorProps) {
  // Queries
  const { data: platforms } = usePlatformsQuery();
  const { data: projectsData } = useProjectsQuery();
  const projects = projectsData?.results || [];

  const { data: documentsData } = useDocumentsQuery();
  const documents = documentsData || [];

  const { data: mediaData } = useMediaQuery();
  const mediaAssets = mediaData?.results || [];

  // Local state
  const [title, setTitle] = useState("");
  const [platformId, setPlatformId] = useState<number | "">("");
  const [projectId, setProjectId] = useState<number | "">("");
  const [documentId, setDocumentId] = useState<number | "">("");
  const [contentType, setContentType] = useState("Generic Content");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredMediaId, setFeaturedMediaId] = useState<number | "">("");
  const [tagsString, setTagsString] = useState("");
  
  // SEO state
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Sync from document trigger
  const [shouldSyncDoc, setShouldSyncDoc] = useState(false);

  // Initialize form if editing existing item
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setPlatformId(item.platform);
      setProjectId(item.project);
      setDocumentId(item.document || "");
      setContentType(item.content_type);
      setExcerpt(item.excerpt);
      setContent(item.content);
      setFeaturedMediaId(item.featured_media || "");
      setTagsString(item.tags?.join(", ") || "");
      setSeoTitle(item.seo_title || "");
      setSeoDescription(item.seo_description || "");
      setCanonicalUrl(item.canonical_url || "");
    } else {
      // Defaults
      setTitle("");
      setPlatformId("");
      setProjectId("");
      setDocumentId("");
      setContentType("Generic Content");
      setExcerpt("");
      setContent("");
      setFeaturedMediaId("");
      setTagsString("");
      setSeoTitle("");
      setSeoDescription("");
      setCanonicalUrl("");
    }
  }, [item]);

  // Sync with selected document content if requested
  const handleDocSync = () => {
    if (!documentId) return;
    const doc = documents.find((d) => d.id === Number(documentId));
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
      setExcerpt(doc.excerpt);
      setSeoTitle(doc.title);
      setSeoDescription(doc.excerpt);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !platformId || !projectId) {
      alert("Title, Platform, and Project are required!");
      return;
    }

    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload: any = {
      title,
      platform: Number(platformId),
      project: Number(projectId),
      document: documentId ? Number(documentId) : null,
      content_type: contentType,
      excerpt,
      content,
      featured_media: featuredMediaId ? Number(featuredMediaId) : null,
      tags,
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical_url: canonicalUrl || null,
    };

    await onSave(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 pb-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Icons.Edit3 size={15} className="text-indigo-500" />
          {item ? "Edit Publishing Draft" : "Create Publishing Draft"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400"
        >
          <Icons.X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            Post Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Day 10 Launch Strategy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* Grid Platform & Project */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              Platform *
            </label>
            <select
              value={platformId}
              required
              onChange={(e) => setPlatformId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
            >
              <option value="">Select Platform</option>
              {platforms?.map((plat) => (
                <option key={plat.id} value={plat.id}>
                  {plat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              Project *
            </label>
            <select
              value={projectId}
              required
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
            >
              <option value="">Select Project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linked Studio Document & Sync */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              Link Writing Document
            </label>
            <select
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
            >
              <option value="">No Document Linked</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          {documentId && (
            <button
              type="button"
              onClick={handleDocSync}
              className="flex items-center justify-center gap-1.5 h-9 w-full px-4 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-all"
            >
              <Icons.RefreshCw size={13} className="animate-spin-slow" />
              Sync Document Data
            </button>
          )}
        </div>

        {/* Content Type & Featured Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              Content Sub-Type
            </label>
            <input
              type="text"
              placeholder="e.g. Tutorial Video, Image Carousel"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              Featured Media Asset
            </label>
            <select
              value={featuredMediaId}
              onChange={(e) => setFeaturedMediaId(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
            >
              <option value="">No Media Linked</option>
              {mediaAssets.map((media) => (
                <option key={media.id} value={media.id}>
                  {media.title} ({media.asset_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            Excerpt / Summary Description
          </label>
          <input
            type="text"
            placeholder="Short hook sentence..."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* Content Body */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            Content Body
          </label>
          <textarea
            placeholder="Draft copy, scripts, captions or details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            Tags (comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. strategy, launch, youtube"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* SEO Collapsible Section */}
        <SEOCard
          seoTitle={seoTitle}
          setSeoTitle={setSeoTitle}
          seoDescription={seoDescription}
          setSeoDescription={setSeoDescription}
          canonicalUrl={canonicalUrl}
          setCanonicalUrl={setCanonicalUrl}
          slug={item?.slug || ""}
        />
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-1.5 h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
        >
          <Icons.Check size={14} />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
