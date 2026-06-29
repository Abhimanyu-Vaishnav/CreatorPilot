"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuth } from "../../features/identity";
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  Project,
  ProjectDialog,
  DeleteConfirmationDialog,
  ProjectCard,
} from "../../features/projects";
import {
  User,
  ShieldCheck,
  Database,
  Video,
  Bookmark,
  Globe,
  Check,
  Loader2,
  Save,
  FolderKanban,
  Star,
  Plus,
  ArrowRight,
  Clock,
  LayoutDashboard,
  FolderPlus,
  Tag,
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { user, updateProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const createParam = searchParams?.get("create");
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "profile">("overview");

  // Local profile state for form
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [youtube, setYoutube] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [website, setWebsite] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog States for projects
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Trigger create dialog on ?create=true URL query parameter
  useEffect(() => {
    if (createParam === "true") {
      setIsDialogOpen(true);
      router.replace("/dashboard");
    }
  }, [createParam, router]);

  // Fetch all projects (limit 100 to get stats and recent/favorites)
  const {
    data: projectsData,
    isLoading: projectsLoading,
  } = useProjectsQuery({ limit: 100 });

  // Mutations
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  // Initialize profile fields once user is loaded
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || "");
      setBio(user.profile.bio || "");
      setYoutube(user.profile.youtube_handle || "");
      setPinterest(user.profile.pinterest_handle || "");
      setWebsite(user.profile.website_url || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      await updateProfile({
        full_name: fullName,
        bio: bio,
        youtube_handle: youtube,
        pinterest_handle: pinterest,
        website_url: website || null,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to update profile. Please ensure input fields are valid.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleProjectSubmit = async (formData: any) => {
    if (selectedProject) {
      await updateMutation.mutateAsync({
        slug: selectedProject.slug,
        data: formData,
      });
    } else {
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

  // Compute stats
  const allProjects = projectsData?.results || [];
  const totalProjects = allProjects.length;
  const favoriteProjects = allProjects.filter((p) => p.favorite && !p.archived);
  const activeProjects = allProjects.filter((p) => !p.archived);
  
  // Sort projects by last_opened_at (descending)
  const recentProjects = [...allProjects]
    .filter((p) => !p.archived && p.last_opened_at)
    .sort((a, b) => {
      const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
      const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  // Group active projects count by category
  const categoryCounts: Record<string, number> = {};
  allProjects.forEach((p) => {
    if (!p.archived) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }
  });
  const categoryList = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  return (
    <DashboardLayout>
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Creator Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-1">Foundational workspace. Manage your digital channels and creative projects.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "overview"
                ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <LayoutDashboard size={13} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "profile"
                ? "bg-white dark:bg-[#0c0c0f] text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <User size={13} />
            Profile Details
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        /* Overview Workspace Tab */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Stat: Total Projects */}
            <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Projects</span>
                <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {projectsLoading ? <Loader2 size={20} className="animate-spin text-zinc-400" /> : totalProjects}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/10">
                <FolderKanban size={18} />
              </div>
            </div>

            {/* Stat: Active Projects */}
            <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Active Workspace</span>
                <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {projectsLoading ? <Loader2 size={20} className="animate-spin text-zinc-400" /> : activeProjects.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/10">
                <Check size={18} />
              </div>
            </div>

            {/* Stat: Favorite Projects */}
            <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Starred Favorites</span>
                <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {projectsLoading ? <Loader2 size={20} className="animate-spin text-zinc-400" /> : favoriteProjects.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/10">
                <Star size={18} className="fill-amber-500/10" />
              </div>
            </div>
          </div>

          {/* Overview Grid Section */}
          {projectsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-xs text-zinc-500">Loading dashboard data...</p>
            </div>
          ) : allProjects.length === 0 ? (
            /* Illustrative Empty State when no projects exist */
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/30 dark:bg-[#0e0e11]/20 flex flex-col items-center justify-center max-w-xl mx-auto space-y-4 shadow-sm py-16">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                <FolderPlus size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Create your first project</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                  Start your creative journey. Select template presets to organize channel distribution configurations, writing draft files, and notes.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setIsDialogOpen(true);
                }}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                New Project
              </button>
            </div>
          ) : (
            /* Dashboard layout */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Recent Projects and Pinned Favorites */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Section: Starred / Pinned Favorites */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Star className="text-amber-500 fill-amber-500" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Pinned Projects</h3>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                      {favoriteProjects.length} Pinned
                    </span>
                  </div>

                  {favoriteProjects.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-400">
                      No pinned projects. Star any project to pin it here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favoriteProjects.slice(0, 4).map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onEdit={(project) => {
                            setSelectedProject(project);
                            setIsDialogOpen(true);
                          }}
                          onDelete={(project) => {
                            setSelectedProject(project);
                            setIsDeleteOpen(true);
                          }}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Recent Projects ordered by last_opened_at */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="text-indigo-600 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Recently Opened Workspaces</h3>
                    </div>
                    <Link
                      href="/dashboard/projects"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      Workspace Views
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {recentProjects.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-400">
                      No recently opened projects. Click to open any workspace.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recentProjects.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onEdit={(project) => {
                            setSelectedProject(project);
                            setIsDialogOpen(true);
                          }}
                          onDelete={(project) => {
                            setSelectedProject(project);
                            setIsDeleteOpen(true);
                          }}
                          onToggleFavorite={handleToggleFavorite}
                          onToggleArchive={handleToggleArchive}
                        />
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Categories breakdown & Quick Actions */}
              <div className="space-y-6">
                
                {/* Panel: Quick Actions */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Quick Actions</h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => {
                        setSelectedProject(null);
                        setIsDialogOpen(true);
                      }}
                      className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus size={14} />
                      New Project
                    </button>
                    <Link
                      href="/dashboard/projects"
                      className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FolderKanban size={14} />
                      All Project Workspaces
                    </Link>
                  </div>
                </div>

                {/* Panel: Project Categories Breakdown */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                    <Tag size={13} />
                    Project Categories
                  </h3>

                  {categoryList.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4">No categories configured.</p>
                  ) : (
                    <div className="space-y-3 font-semibold text-xs">
                      {categoryList.map((cat) => (
                        <div key={cat.name} className="flex justify-between items-center py-1.5 border-b border-zinc-100 dark:border-zinc-900/20 last:border-0 text-zinc-800 dark:text-zinc-200">
                          <span className="text-zinc-500">{cat.name}</span>
                          <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/20 dark:border-zinc-800/30 px-2 py-0.5 rounded text-[10px] text-zinc-600 dark:text-zinc-400">
                            {cat.count} {cat.count === 1 ? "project" : "projects"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Connected Checklist */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Channel Integration</h3>
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                        <Video size={16} className={youtube ? "text-indigo-600" : "text-zinc-400"} />
                        YouTube Channel
                      </span>
                      <span className={`text-[10px] ${youtube ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                        {youtube ? "Configured" : "Missing"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                        <Bookmark size={16} className={pinterest ? "text-indigo-600" : "text-zinc-400"} />
                        Pinterest Board
                      </span>
                      <span className={`text-[10px] ${pinterest ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                        {pinterest ? "Configured" : "Missing"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
                        <Globe size={16} className={website ? "text-indigo-600" : "text-zinc-400"} />
                        Personal Blog
                      </span>
                      <span className={`text-[10px] ${website ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                        {website ? "Configured" : "Missing"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      ) : (
        /* Creator Profile Details Form Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <User className="text-indigo-600 dark:text-indigo-400" size={18} />
              <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Creator Profile Details</h2>
            </div>

            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://janedoe.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Biography / Description
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief details about your content domains, goals, or targets..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    YouTube handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-[10px] text-zinc-500 font-semibold">youtube.com/</span>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="@janedoe"
                      className="w-full h-10 pl-24 pr-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Pinterest handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-[10px] text-zinc-500 font-semibold">pinterest.com/</span>
                    <input
                      type="text"
                      value={pinterest}
                      onChange={(e) => setPinterest(e.target.value)}
                      placeholder="janedoe"
                      className="w-full h-10 pl-24 pr-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-75 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving Changes...
                    </>
                  ) : savedSuccess ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      Profile Updated
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar specs info */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Security Credentials</h3>
              </div>
              
              <div className="space-y-3 text-xs leading-normal font-semibold">
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                  <span className="text-zinc-500">Auth Token Type</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">JWT Bearer</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                  <span className="text-zinc-500">Role Authority</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Authenticated Creator</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-500">Database Engine</span>
                  <span className="font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                    <Database size={12} className="text-zinc-400" />
                    SQLite Fallback
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Create / Edit Dialog Component */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleProjectSubmit}
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    }>
      <DashboardContent />
    </Suspense>
  );
}
