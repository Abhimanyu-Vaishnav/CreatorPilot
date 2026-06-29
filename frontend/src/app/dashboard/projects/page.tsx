"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  Project,
  ProjectDialog,
  DeleteConfirmationDialog,
  ProjectCard,
} from "../../../features/projects";
import {
  Plus,
  Search,
  SlidersHorizontal,
  FolderKanban,
  Archive,
  Loader2,
  AlertCircle,
  FolderPlus,
} from "lucide-react";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const createParam = searchParams?.get("create");

  // Query Filter and Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [ordering, setOrdering] = useState<string>("-favorite,-created_at");

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Trigger Create Dialog on query parameter '?create=true'
  useEffect(() => {
    if (createParam === "true") {
      setIsDialogOpen(true);
      // Clean query parameter from URL
      router.replace("/dashboard/projects");
    }
  }, [createParam, router]);

  // API query
  const {
    data,
    isLoading,
    isError,
    error,
  } = useProjectsQuery({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    archived: showArchived,
    ordering: ordering || undefined,
  });

  // API mutations
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const handleCreateSubmit = async (formData: any) => {
    if (selectedProject) {
      // Edit mode using slug
      await updateMutation.mutateAsync({
        slug: selectedProject.slug,
        data: formData,
      });
    } else {
      // Create mode
      await createMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await deleteMutation.mutateAsync(selectedProject.slug);
      setIsDeleteOpen(false);
      setSelectedProject(null);
    }
  };

  const handleToggleFavorite = async (slug: string, favorite: boolean) => {
    await updateMutation.mutateAsync({
      slug,
      data: { favorite },
    });
  };

  const handleToggleArchive = async (slug: string, archived: boolean) => {
    await updateMutation.mutateAsync({
      slug,
      data: { archived },
    });
  };

  const openCreateDialog = () => {
    setSelectedProject(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  // Get project lists
  const projectsList = data?.results || [];

  // Common preset category filter list
  const commonCategories = ["General", "YouTube", "Pinterest", "Blog", "Client", "Course"];

  return (
    <DashboardLayout>
      {/* Upper header action section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
            <FolderKanban className="text-indigo-600 dark:text-indigo-400" size={24} />
            Projects Workspace
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Create, manage, and coordinate distinct channels, assets, and project files.
          </p>
        </div>

        <button
          onClick={openCreateDialog}
          className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Toolbar: Search, Filters, Sort */}
      <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-zinc-400" size={15} />
            <input
              type="text"
              placeholder="Search projects by title or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all placeholder-zinc-400"
            />
          </div>

          {/* Filters & Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Select */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl px-2.5 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 outline-none text-xs bg-transparent text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                <option value="">All</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
              </select>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl px-2.5 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 outline-none text-xs bg-transparent text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                <option value="">All</option>
                {commonCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl px-2.5 border border-zinc-200/50 dark:border-zinc-800/50">
              <SlidersHorizontal size={12} className="text-zinc-400" />
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className="h-9 outline-none text-xs bg-transparent text-zinc-700 dark:text-zinc-300 font-semibold"
              >
                <option value="-favorite,-created_at">Favorites First</option>
                <option value="-created_at">Newest Updated</option>
                <option value="created_at">Oldest Created</option>
                <option value="title">Title A-Z</option>
                <option value="-title">Title Z-A</option>
              </select>
            </div>

            {/* Archive Filter Toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`h-9 px-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                showArchived
                  ? "bg-zinc-500/10 border-zinc-500/35 text-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/50 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Archive size={13} />
              {showArchived ? "Archived Projects Only" : "Show Archived"}
            </button>
          </div>

        </div>
      </div>

      {/* Projects Grid State Rendering */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
          <p className="text-xs text-zinc-500 font-medium">Fetching workspace projects...</p>
        </div>
      ) : isError ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Failed to load projects:</span>{" "}
            {error instanceof Error ? error.message : "Ensure backend is responsive."}
          </div>
        </div>
      ) : projectsList.length === 0 ? (
        /* Empty State */
        <div className="p-8 md:p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/30 dark:bg-[#0e0e11]/20 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/30 flex items-center justify-center text-zinc-400 dark:text-zinc-600 shadow-inner">
            <FolderPlus size={22} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Create your first project</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
              {searchQuery || statusFilter || categoryFilter
                ? "No items match your active filters. Try refining your criteria or resetting filters."
                : "Create your first project workspace to manage writing drafts, media vaults, and channel connections."}
            </p>
          </div>
          
          {(searchQuery || statusFilter || categoryFilter) ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setCategoryFilter("");
                setShowArchived(false);
              }}
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={openCreateDialog}
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              New Project
            </button>
          )}
        </div>
      ) : (
        /* Grid of Projects */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog Component */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleCreateSubmit}
        project={selectedProject}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Component */}
      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedProject(null);
        }}
        projectName={selectedProject?.title || ""}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    }>
      <ProjectsContent />
    </Suspense>
  );
}
