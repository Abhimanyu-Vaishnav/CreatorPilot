"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../../../../components/layout/DashboardLayout";
import { Breadcrumbs } from "../../../../../../features/projects/components/Breadcrumbs";
import {
  useKnowledgeItemQuery,
  useUpdateKnowledgeMutation,
  useDeleteKnowledgeMutation,
} from "../../../../../../features/vault";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Star,
  Pin,
  Archive,
  Trash2,
  FileText,
  Link2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getKnowledgeTypeIcon } from "../../../../../../features/vault/components/KnowledgeWorkspace";

export default function KnowledgeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params?.slug as string;
  const knowledgeSlug = params?.knowledgeSlug as string;

  const { data: item, isLoading, isError, error } = useKnowledgeItemQuery(knowledgeSlug);

  const updateMutation = useUpdateKnowledgeMutation(projectSlug);
  const deleteMutation = useDeleteKnowledgeMutation(projectSlug);

  const handleToggleFavorite = async () => {
    if (!item) return;
    await updateMutation.mutateAsync({
      slug: item.slug,
      data: { favorite: !item.favorite },
    });
  };

  const handleTogglePin = async () => {
    if (!item) return;
    await updateMutation.mutateAsync({
      slug: item.slug,
      data: { pinned: !item.pinned },
    });
  };

  const handleToggleArchive = async () => {
    if (!item) return;
    const nextArchived = !item.archived;
    await updateMutation.mutateAsync({
      slug: item.slug,
      data: { archived: nextArchived },
    });
    // Redirect back to vault tab if archived
    if (nextArchived) {
      router.push(`/dashboard/projects/${projectSlug}?tab=vault`);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (confirm("Are you sure you want to permanently delete this resource? This cannot be undone.")) {
      await deleteMutation.mutateAsync(item.slug);
      router.push(`/dashboard/projects/${projectSlug}?tab=vault`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-650" size={32} />
          <p className="text-xs text-zinc-500 font-semibold">Opening resource details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !item) {
    return (
      <DashboardLayout>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Error:</span>{" "}
            {error instanceof Error ? error.message : "Knowledge item not found."}
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={`/dashboard/projects/${projectSlug}?tab=vault`}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft size={14} /> Back to Knowledge Vault
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const TypeIcon = getKnowledgeTypeIcon(item.type);

  const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(item.updated_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <Breadcrumbs
          customBreadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projects", href: "/dashboard/projects" },
            { label: item.project_title, href: `/dashboard/projects/${projectSlug}` },
            { label: "Knowledge Vault", href: `/dashboard/projects/${projectSlug}?tab=vault` },
            { label: item.title, href: "" },
          ]}
        />

        {/* Back Link */}
        <div>
          <Link
            href={`/dashboard/projects/${projectSlug}?tab=vault`}
            className="text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Knowledge Vault
          </Link>
        </div>

        {/* Details Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 font-sans">
          
          {/* Left Column: Metadata and Main Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Resource Card */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                  <TypeIcon size={22} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 text-[9px] uppercase font-bold tracking-wider text-zinc-500">
                    {item.type}
                  </span>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {item.title}
                  </h1>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2 pt-2 border-t border-zinc-150 dark:border-zinc-900/30">
                <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Resource Notes & Description
                </h3>
                <p className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed whitespace-pre-line font-medium">
                  {item.description || "No description provided."}
                </p>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Associated Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-250/20 text-[10px] font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Linkage: Related Note Section */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                <Link2 size={16} className="text-zinc-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Cross Linked Note Drafts
                </h3>
              </div>

              {item.note_reference ? (
                <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-950/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-semibold text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-650 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
                        {item.note_title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                        Linked project draft note workspace
                      </p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/dashboard/projects/${projectSlug}/notes/${item.note_slug}`}
                    className="h-8 px-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Open Draft Note
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-3 text-center font-medium">
                  This resource has not been linked to a project draft note yet. Link a note in edit mode to see it here.
                </p>
              )}
            </div>

          </div>

          {/* Right Column: Actions and Metadata Side Bar */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 font-semibold text-xs">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                Resource Controls
              </h3>
              
              <div className="space-y-2">
                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ExternalLink size={13} />
                    Visit Source Website
                  </a>
                )}

                <button
                  onClick={handleToggleFavorite}
                  className={`w-full h-9 rounded-xl border transition-colors flex items-center justify-between px-3 ${
                    item.favorite
                      ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Star size={13} className={item.favorite ? "fill-amber-500" : ""} />
                    {item.favorite ? "Starred Resource" : "Mark as Favorite"}
                  </span>
                </button>

                <button
                  onClick={handleTogglePin}
                  className={`w-full h-9 rounded-xl border transition-colors flex items-center justify-between px-3 ${
                    item.pinned
                      ? "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Pin size={13} className={item.pinned ? "fill-indigo-500/20" : ""} />
                    {item.pinned ? "Pinned to Top" : "Pin to Top"}
                  </span>
                </button>

                <button
                  onClick={handleToggleArchive}
                  className="w-full h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between px-3 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="flex items-center gap-2">
                    <Archive size={13} />
                    {item.archived ? "Restore to Vault" : "Archive Resource"}
                  </span>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-2" />

                <button
                  onClick={handleDelete}
                  className="w-full h-9 rounded-xl border border-rose-500/10 hover:bg-rose-500/5 text-rose-500 transition-colors flex items-center justify-between px-3"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={13} />
                    Delete permanently
                  </span>
                </button>
              </div>
            </div>

            {/* Time Metadata details */}
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 font-semibold text-xs text-zinc-700 dark:text-zinc-300">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-zinc-400">
                Resource Logs & Metadata
              </h3>
              
              <div className="space-y-3 font-medium">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900/40">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Added
                  </span>
                  <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50">{createdDate}</span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900/40">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Clock size={12} />
                    Modified
                  </span>
                  <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50">{updatedDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Resource Identifier</span>
                  <code className="text-[9px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/20 px-1.5 py-0.5 rounded text-zinc-800 dark:text-zinc-200">
                    {item.slug}
                  </code>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
