"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
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
  useRecentActivityQuery,
} from "../../features/projects";
import { useNotesQuery } from "../../features/notes";
import { useKnowledgeQuery } from "../../features/vault";
import { useTasksQuery } from "../../features/tasks";
import { useCalendarEventsQuery } from "../../features/planner";
import { useDocumentsQuery } from "../../features/studio";
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
  FileText,
  Pin,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
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

  // Fetch recent activity feed
  const {
    data: recentActivities,
    isLoading: activitiesLoading,
  } = useRecentActivityQuery();

  // Fetch notes list
  const {
    data: allNotes = [],
    isLoading: notesLoading,
  } = useNotesQuery();

  // Fetch knowledge list
  const {
    data: allKnowledge = [],
    isLoading: knowledgeLoading,
  } = useKnowledgeQuery();

  // Fetch tasks list
  const {
    data: allTasks = [],
    isLoading: tasksLoading,
  } = useTasksQuery();

  // Fetch calendar events
  const {
    data: calendarEvents = [],
    isLoading: calendarLoading,
  } = useCalendarEventsQuery();

  // Fetch documents list
  const {
    data: allDocuments = [],
    isLoading: documentsLoading,
  } = useDocumentsQuery();

  const activeDocs = allDocuments.filter((d) => !d.archived);


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

  // Tasks widgets calculations
  const tasksWidgets = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Today's Tasks
    const todayTasks = allTasks.filter(
      (t) => !t.archived && t.due_date && new Date(t.due_date).toDateString() === todayStr
    );

    // Overdue Tasks
    const overdueTasks = allTasks.filter(
      (t) => !t.archived && t.due_date && new Date(t.due_date) < now && t.status !== "Completed"
    );

    // Recently Completed
    const recentlyCompleted = [...allTasks]
      .filter((t) => !t.archived && t.status === "Completed" && t.completed_at)
      .sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);

    // Upcoming Deadlines (next 7 days, excluding today)
    const upcomingDeadlines = [...allTasks]
      .filter((t) => {
        if (t.archived || t.status === "Completed" || !t.due_date) return false;
        const due = new Date(t.due_date);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return due > now && due.toDateString() !== todayStr && diffDays <= 7;
      })
      .sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5);

    return {
      todayTasks: todayTasks.slice(0, 5),
      overdueTasks: overdueTasks.slice(0, 5),
      recentlyCompleted,
      upcomingDeadlines,
    };
  }, [allTasks]);

  // Calendar planner widgets calculations
  const plannerWidgets = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const todayEvents = calendarEvents.filter((e) => {
      if (!e.start_datetime) return false;
      const start = new Date(e.start_datetime);
      const end = e.end_datetime ? new Date(e.end_datetime) : start;
      return (
        start.toDateString() === todayStr ||
        end.toDateString() === todayStr ||
        (start <= now && end >= now)
      );
    });

    const upcomingEvents = calendarEvents
      .filter((e) => {
        if (!e.start_datetime) return false;
        const start = new Date(e.start_datetime);
        return start > now && start.toDateString() !== todayStr;
      })
      .slice(0, 5);

    const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisWeekEvents = calendarEvents.filter((e) => {
      if (!e.start_datetime) return false;
      const start = new Date(e.start_datetime);
      return start >= now && start <= endOfWeek;
    });

    const projectMilestones = calendarEvents
      .filter((e) => e.event_type === "Milestone")
      .slice(0, 5);

    return {
      todayEvents: todayEvents.slice(0, 5),
      upcomingEvents,
      thisWeekEvents,
      projectMilestones,
    };
  }, [calendarEvents]);


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

                {/* Section: Content Planner & Schedule */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-indigo-650 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Content Planner & Schedule</h3>
                    </div>
                    <Link
                      href="/dashboard/planner"
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 transition-colors"
                    >
                      Open Planner →
                    </Link>
                  </div>

                  {calendarLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-zinc-400" />
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-450 dark:text-zinc-550 font-semibold">
                      No calendar events scheduled. Click Open Planner to configure.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sub-grid 1: Today's Schedule & Milestones */}
                      <div className="space-y-4">
                        {/* Widget: Today's Schedule */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 dark:text-zinc-500">
                            <Clock size={11} className="text-indigo-500" /> Today's Schedule
                          </span>
                          {plannerWidgets.todayEvents.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No events scheduled for today.</p>
                          ) : (
                            <div className="space-y-2">
                              {plannerWidgets.todayEvents.map((e) => (
                                <Link
                                  key={e.id}
                                  href={String(e.id).startsWith("task_") ? `/dashboard/projects/${e.project_slug}/tasks/${e.related_task}` : "/dashboard/planner"}
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="flex flex-col min-w-0 flex-1 pr-2">
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{e.title}</span>
                                    <span className="text-[8px] text-zinc-450 mt-0.5 font-bold">
                                      {e.start_datetime ? new Date(e.start_datetime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "All Day"}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-500/10 bg-indigo-50/50 text-indigo-500 shrink-0">
                                    {e.event_type}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Widget: Project Milestones */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Bookmark size={11} className="fill-amber-500/10" /> Key Milestones
                          </span>
                          {plannerWidgets.projectMilestones.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No active milestones configured.</p>
                          ) : (
                            <div className="space-y-2">
                              {plannerWidgets.projectMilestones.map((e) => (
                                <Link
                                  key={e.id}
                                  href="/dashboard/planner"
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-amber-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-550 truncate block">{e.title}</span>
                                    {e.project_title && (
                                      <span className="text-[8px] text-indigo-500 uppercase tracking-wider font-bold block mt-0.5">
                                        {e.project_title}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[8px] text-zinc-450 font-bold shrink-0">
                                    {e.start_datetime ? new Date(e.start_datetime).toLocaleDateString() : ""}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-grid 2: Upcoming & This Week */}
                      <div className="space-y-4">
                        {/* Widget: This Week */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 dark:text-zinc-500">
                            <Calendar size={11} className="text-indigo-500" /> Agenda (This Week)
                          </span>
                          {plannerWidgets.thisWeekEvents.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No events scheduled for this week.</p>
                          ) : (
                            <div className="space-y-2">
                              {plannerWidgets.thisWeekEvents.slice(0, 3).map((e) => (
                                <Link
                                  key={e.id}
                                  href="/dashboard/planner"
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate flex-1">{e.title}</span>
                                  <span className="text-[8px] text-zinc-450 font-bold shrink-0">
                                    {e.start_datetime ? new Date(e.start_datetime).toLocaleDateString(undefined, { weekday: "short" }) : ""}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Widget: Upcoming Events */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 dark:text-zinc-500">
                            <Calendar size={11} /> Upcoming Releases (14 Days)
                          </span>
                          {plannerWidgets.upcomingEvents.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No upcoming events scheduled.</p>
                          ) : (
                            <div className="space-y-2">
                              {plannerWidgets.upcomingEvents.map((e) => (
                                <Link
                                  key={e.id}
                                  href="/dashboard/planner"
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate flex-1">{e.title}</span>
                                  <span className="text-[8px] text-zinc-450 font-bold shrink-0">
                                    {e.start_datetime ? new Date(e.start_datetime).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Tasks Widgets */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4 font-sans">

                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="text-indigo-650 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Task Workspace Overview</h3>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      {allTasks.filter((t) => !t.archived && t.status !== "Completed").length} pending tasks
                    </span>
                  </div>

                  {tasksLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-zinc-400" />
                    </div>
                  ) : allTasks.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-450 font-semibold dark:text-zinc-500">
                      No tasks found. Open a project workspace and click the Tasks tab to add action items.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sub-grid 1: Today & Overdue */}
                      <div className="space-y-4">
                        {/* Widget: Today's Tasks */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 dark:text-zinc-500">
                            <Clock size={11} className="text-indigo-500" /> Today's Action Items
                          </span>
                          {tasksWidgets.todayTasks.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No tasks scheduled for today.</p>
                          ) : (
                            <div className="space-y-2">
                              {tasksWidgets.todayTasks.map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/dashboard/projects/${t.project_slug}/tasks/${t.id}`}
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-zinc-905 dark:text-zinc-50 truncate flex-1">{t.title}</span>
                                  <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-500/10 bg-indigo-50/50 text-indigo-500">{t.priority}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Widget: Overdue Tasks */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-rose-50/5 dark:bg-rose-950/5 font-semibold">
                          <span className="text-[10px] font-bold text-rose-500 dark:text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle size={11} /> Overdue Warnings
                          </span>
                          {tasksWidgets.overdueTasks.length === 0 ? (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-450 py-1 font-semibold">Great job! No overdue tasks.</p>
                          ) : (
                            <div className="space-y-2">
                              {tasksWidgets.overdueTasks.map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/dashboard/projects/${t.project_slug}/tasks/${t.id}`}
                                  className="flex items-center justify-between p-2 rounded-lg border border-rose-250/20 bg-white dark:bg-[#0c0c0f] hover:border-rose-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-450 truncate flex-1">{t.title}</span>
                                  <span className="text-[8px] text-zinc-400 font-semibold">{t.due_date ? new Date(t.due_date).toLocaleDateString() : ""}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-grid 2: Upcoming & Completed */}
                      <div className="space-y-4">
                        {/* Widget: Upcoming Deadlines */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 dark:text-zinc-500">
                            <Calendar size={11} /> Upcoming Deadlines (7 Days)
                          </span>
                          {tasksWidgets.upcomingDeadlines.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No upcoming deadlines.</p>
                          ) : (
                            <div className="space-y-2">
                              {tasksWidgets.upcomingDeadlines.map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/dashboard/projects/${t.project_slug}/tasks/${t.id}`}
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate flex-1">{t.title}</span>
                                  <span className="text-[8px] text-zinc-450 font-bold">{t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Widget: Recently Completed */}
                        <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={11} /> Recently Completed
                          </span>
                          {tasksWidgets.recentlyCompleted.length === 0 ? (
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-1 font-semibold">No tasks completed recently.</p>
                          ) : (
                            <div className="space-y-2">
                              {tasksWidgets.recentlyCompleted.map((t) => (
                                <Link
                                  key={t.id}
                                  href={`/dashboard/projects/${t.project_slug}/tasks/${t.id}`}
                                  className="flex items-center justify-between p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <span className="text-[11px] font-bold text-zinc-450 dark:text-zinc-550 line-through truncate flex-1">{t.title}</span>
                                  <span className="text-[8px] text-emerald-500 font-bold">Done</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>                {/* Section: Writing Studio Widgets */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="text-indigo-600 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-550">Writing Studio Docs</h3>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      {activeDocs.length} documents
                    </span>
                  </div>

                  {documentsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-zinc-400" />
                    </div>
                  ) : activeDocs.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-450 dark:text-zinc-550 font-semibold">
                      No documents created yet. Open a workspace and choose Writing Studio to add a document.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-xs">
                      {/* Sub-card 1: Drafts & Review */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText size={10} className="text-amber-500" /> Drafts & Review
                        </span>
                        
                        {activeDocs.filter((d) => d.status !== "Published").length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3 italic">No current drafts.</p>
                        ) : (
                          <div className="space-y-2">
                            {activeDocs
                              .filter((d) => d.status !== "Published")
                              .slice(0, 3)
                              .map((d) => (
                                <Link
                                  key={d.id}
                                  href={`/dashboard/projects/${d.project_slug}?tab=writing`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-550 truncate">{d.title}</div>
                                  <div className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-0.5 flex justify-between">
                                    <span>{d.project_title} • {d.word_count} words</span>
                                    <span className="text-amber-500 font-extrabold uppercase text-[8px]">{d.status}</span>
                                  </div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Sub-card 2: Recently Edited */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} className="text-indigo-555" /> Recently Edited
                        </span>
                        
                        {activeDocs.length === 0 ? (
                          <p className="text-[10px] text-zinc-455 dark:text-zinc-555 py-3 italic font-medium">No edits recorded.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...activeDocs]
                              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                              .slice(0, 3)
                              .map((d) => (
                                <Link
                                  key={d.id}
                                  href={`/dashboard/projects/${d.project_slug}?tab=writing`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-550 truncate">{d.title}</div>
                                  <div className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-0.5 truncate">{d.project_title} • {d.reading_time} min read</div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Notes & Drafts Widgets */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="text-indigo-650 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Notes & Drafts</h3>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      {allNotes.filter((n) => !n.archived).length} active drafts
                    </span>
                  </div>

                  {notesLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-zinc-400" />
                    </div>
                  ) : allNotes.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-400">
                      No notes created yet. Open any project workspace to add your first note.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pinned Notes card */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Pin size={10} /> Pinned Notes
                        </span>
                        
                        {allNotes.filter((n) => n.pinned && !n.archived).length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3 font-semibold">No pinned notes. Pin important drafts to see them here.</p>
                        ) : (
                          <div className="space-y-2">
                            {allNotes.filter((n) => n.pinned && !n.archived).slice(0, 3).map((n) => (
                              <Link
                                key={n.id}
                                href={`/dashboard/projects/${n.project_slug}/notes/${n.slug}`}
                                className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                              >
                                <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{n.title}</div>
                                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{n.project_title} • {n.word_count} words</div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Recently Edited Notes card */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} /> Recently Edited
                        </span>
                        
                        {allNotes.filter((n) => !n.archived).length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3 font-semibold">No recent edits.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...allNotes]
                              .filter((n) => !n.archived)
                              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                              .slice(0, 3)
                              .map((n) => (
                                <Link
                                  key={n.id}
                                  href={`/dashboard/projects/${n.project_slug}/notes/${n.slug}`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{n.title}</div>
                                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{n.project_title} • {n.reading_time} min read</div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Knowledge Vault Widgets */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="text-indigo-650 dark:text-indigo-400" size={16} />
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Knowledge Vault</h3>
                    </div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      {allKnowledge.filter((k) => !k.archived).length} items
                    </span>
                  </div>

                  {knowledgeLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={18} className="animate-spin text-zinc-400" />
                    </div>
                  ) : allKnowledge.length === 0 ? (
                    <p className="py-6 text-center text-xs text-zinc-400">
                      No research materials added yet. Open a project workspace to store articles, checklists or notes in the Knowledge Vault.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Widget 1: Recent Knowledge (Recently Added) */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Plus size={10} /> Recent Additions
                        </span>
                        
                        {allKnowledge.filter((k) => !k.archived).length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3">No recent resources.</p>
                        ) : (
                          <div className="space-y-2 font-semibold">
                            {[...allKnowledge]
                              .filter((k) => !k.archived)
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .slice(0, 3)
                              .map((k) => (
                                <Link
                                  key={k.id}
                                  href={`/dashboard/projects/${k.project_slug}/knowledge/${k.slug}`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{k.title}</div>
                                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{k.project_title} • {k.type}</div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Widget 2: Favorite Resources */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Star size={10} /> Starred Favorites
                        </span>
                        
                        {allKnowledge.filter((k) => k.favorite && !k.archived).length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3">No starred favorites. Star important resources to see them here.</p>
                        ) : (
                          <div className="space-y-2">
                            {allKnowledge
                              .filter((k) => k.favorite && !k.archived)
                              .slice(0, 3)
                              .map((k) => (
                                <Link
                                  key={k.id}
                                  href={`/dashboard/projects/${k.project_slug}/knowledge/${k.slug}`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{k.title}</div>
                                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{k.project_title} • {k.type}</div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Widget 3: Recently Viewed */}
                      <div className="border border-zinc-150 dark:border-zinc-900/60 p-4 rounded-xl space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 font-semibold">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          <Clock size={10} /> Recently Viewed
                        </span>
                        
                        {allKnowledge.filter((k) => k.last_opened_at && !k.archived).length === 0 ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-550 py-3">No recently viewed items.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...allKnowledge]
                              .filter((k) => k.last_opened_at && !k.archived)
                              .sort((a, b) => {
                                const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
                                const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
                                return bTime - aTime;
                              })
                              .slice(0, 3)
                              .map((k) => (
                                <Link
                                  key={k.id}
                                  href={`/dashboard/projects/${k.project_slug}/knowledge/${k.slug}`}
                                  className="block p-2 rounded-lg border border-zinc-100 dark:border-zinc-900/20 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm transition-all"
                                >
                                  <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-50 truncate">{k.title}</div>
                                  <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{k.project_title} • {k.type}</div>
                                </Link>
                              ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Categories breakdown & Quick Actions */}
              <div className="space-y-6">
                
                {/* Panel: Recent Activity Feed */}
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Recent Activity
                  </h3>
                  {activitiesLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-zinc-400" />
                    </div>
                  ) : !recentActivities || recentActivities.length === 0 ? (
                    <p className="text-xs text-zinc-400 text-center py-4 font-semibold">No recent activity.</p>
                  ) : (
                    <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                      {recentActivities.slice(0, 5).map((act: any) => (
                        <div key={act.id} className="text-xs space-y-0.5 border-l-2 pl-2.5 border-zinc-100 dark:border-zinc-900">
                          <div className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            {act.action}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                            <span className="truncate max-w-[100px] font-bold">{act.project_title}</span>
                            <span>{act.relative_time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
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
