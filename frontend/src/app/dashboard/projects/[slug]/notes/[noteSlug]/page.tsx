"use client";

import React, { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../../../../components/layout/DashboardLayout";
import { useProjectQuery } from "../../../../../../features/projects";
import {
  SimpleEditor,
  useNoteQuery,
  useUpdateNoteMutation,
} from "../../../../../../features/notes";
import { Breadcrumbs } from "../../../../../../features/projects/components/Breadcrumbs";
import { Loader2, AlertCircle } from "lucide-react";

function NoteDetailContent() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params?.slug as string;
  const noteSlug = params?.noteSlug as string;

  const { data: project, isLoading: isProjectLoading } = useProjectQuery(projectSlug);
  const { data: note, isLoading: isNoteLoading, isError, error } = useNoteQuery(noteSlug);

  const updateMutation = useUpdateNoteMutation();

  const handleSave = async (data: { title: string; content: string }) => {
    if (!note) return;
    await updateMutation.mutateAsync({
      slug: note.slug,
      data,
    });
  };

  const handleToggleFavorite = async () => {
    if (!note) return;
    await updateMutation.mutateAsync({
      slug: note.slug,
      data: { favorite: !note.favorite },
    });
  };

  const handleTogglePin = async () => {
    if (!note) return;
    await updateMutation.mutateAsync({
      slug: note.slug,
      data: { pinned: !note.pinned },
    });
  };

  const handleToggleArchive = async () => {
    if (!note) return;
    const isArchiving = !note.archived;
    await updateMutation.mutateAsync({
      slug: note.slug,
      data: { archived: isArchiving },
    });
    router.push(`/dashboard/projects/${projectSlug}?tab=notes`);
  };

  const handleClose = () => {
    router.push(`/dashboard/projects/${projectSlug}?tab=notes`);
  };

  const isLoading = isProjectLoading || isNoteLoading;

  return (
    <div className="space-y-4">
      {/* Context-aware Breadcrumbs */}
      {project && note && (
        <Breadcrumbs
          projectName={`${project.title} / Notes`}
          projectColor={project.color}
          customBreadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projects", href: "/dashboard/projects" },
            { label: project.title, href: `/dashboard/projects/${projectSlug}` },
            { label: "Notes", href: `/dashboard/projects/${projectSlug}?tab=notes` },
            { label: note.title, href: "#" },
          ]}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
          <p className="text-xs text-zinc-500 font-semibold">Opening editor workspace...</p>
        </div>
      ) : isError || !note ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Editor Error:</span>{" "}
            {error instanceof Error ? error.message : "Note not found or deleted."}
          </div>
        </div>
      ) : (
        <SimpleEditor
          note={note}
          onSave={handleSave}
          onToggleFavorite={handleToggleFavorite}
          onTogglePin={handleTogglePin}
          onToggleArchive={handleToggleArchive}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default function NoteDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
          <p className="text-xs text-zinc-500 font-semibold font-sans">Booting editor canvas...</p>
        </div>
      }>
        <NoteDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
