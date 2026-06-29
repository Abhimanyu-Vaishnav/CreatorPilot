"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "../../../../components/layout/DashboardLayout";
import { useProjectQuery } from "../../../../features/projects";
import { ProjectIcon } from "../../../../features/projects/components/ProjectDialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Folder,
  Tag,
  Loader2,
  AlertCircle,
  FileText,
  CheckSquare,
  Image,
  Database,
  CalendarDays,
  Settings,
  Star,
  Lock,
} from "lucide-react";
import Link from "next/link";

type TabName = "overview" | "notes" | "tasks" | "media" | "vault" | "calendar" | "settings";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [activeTab, setActiveTab] = useState<TabName>("overview");

  // Fetch the project by slug
  const { data: project, isLoading, isError, error } = useProjectQuery(slug);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
          <p className="text-xs text-zinc-500 font-medium">Opening project workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !project) {
    return (
      <DashboardLayout>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <span className="font-bold">Project Error:</span>{" "}
            {error instanceof Error ? error.message : "Project not found. Ensure slug is correct."}
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft size={14} /> Back to Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Format Dates
  const createdDate = new Date(project.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const updatedDate = new Date(project.updated_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const tabs: { id: TabName; label: string; icon: any; lock?: boolean }[] = [
    { id: "overview", label: "Overview", icon: Folder },
    { id: "notes", label: "Notes", icon: FileText, lock: true },
    { id: "tasks", label: "Tasks", icon: CheckSquare, lock: true },
    { id: "media", label: "Media Library", icon: Image, lock: true },
    { id: "vault", label: "Knowledge Vault", icon: Database, lock: true },
    { id: "calendar", label: "Content Calendar", icon: CalendarDays, lock: true },
    { id: "settings", label: "Settings", icon: Settings, lock: true },
  ];

  return (
    <DashboardLayout>
      {/* Back button & header summary */}
      <div className="space-y-4">
        <Link
          href="/dashboard/projects"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Projects
        </Link>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-4">
            {/* Custom Icon Container */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                color: project.color,
                backgroundColor: `${project.color}15`,
                border: `1px solid ${project.color}30`,
              }}
            >
              <ProjectIcon name={project.icon} size={24} />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {project.title}
                </h1>
                {project.favorite && (
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {project.category}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" style={{ backgroundColor: project.color }} />
                  {project.status}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] text-zinc-500 space-y-1 font-medium">
            <p className="flex items-center gap-1 md:justify-end">
              <Calendar size={12} />
              Created on {createdDate}
            </p>
            <p className="flex items-center gap-1 md:justify-end">
              <Clock size={12} />
              Last active: {updatedDate}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="flex items-center gap-1 border-b border-zinc-200/60 dark:border-zinc-800/50 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.lock && (
                <Lock size={10} className="text-zinc-400 dark:text-zinc-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace Area */}
      <div className="pt-4">
        {activeTab === "overview" ? (
          /* Overview Panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description & metadata cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description Panel */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Project Goals & Description</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {project.description || "No project description provided yet. Click edit in the Projects workspace to add details and outline deliverables."}
                </p>
              </div>

              {/* Quick Preset Template Config */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Active Workspace Template</h3>
                <div className="flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">Template Type: {project.template}</p>
                    <p className="text-[10px] text-zinc-500">Prefilled default color accents and categorized folders.</p>
                  </div>
                  <span className="text-[10px] bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-lg">
                    Preset Configured
                  </span>
                </div>
              </div>

            </div>

            {/* Right side info panel */}
            <div className="space-y-6">
              {/* Bounded context helper box */}
              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] space-y-3.5 shadow-sm">
                <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bounded Context Specs</h4>
                <div className="space-y-3 text-xs leading-normal font-medium">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                    <span className="text-zinc-500">Slug Identifier</span>
                    <code className="text-[10px] bg-zinc-50 dark:bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-200/20 text-zinc-800 dark:text-zinc-200 font-semibold">{project.slug}</code>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                    <span className="text-zinc-500">Workspace Status</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{project.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-500">Theme Color</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-800" style={{ backgroundColor: project.color }} />
                      <span className="font-mono text-[10px] uppercase text-zinc-800 dark:text-zinc-200">{project.color}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Placeholder views for locked tabs */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-600 shadow-inner">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Module Coming Soon</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                The {tabs.find((t) => t.id === activeTab)?.label} workspace module is currently locked and will be implemented in a future development phase.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("overview")}
              className="h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Back to Overview
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
