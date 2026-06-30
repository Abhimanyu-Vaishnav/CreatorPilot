"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star, Edit2, Trash2, Archive, Calendar, Circle } from "lucide-react";
import { Project } from "../types";
import { ProjectIcon } from "./ProjectDialog";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onToggleFavorite: (slug: string, favorite: boolean) => Promise<void>;
  onToggleArchive: (slug: string, archived: boolean) => Promise<void>;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
}: ProjectCardProps) {
  const router = useRouter();
  const accentColor = project.color || "#6366f1";
  
  // Format Date cleanly
  const formattedDate = new Date(project.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "In Progress":
        return "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20";
      case "Completed":
        return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20";
      case "Paused":
        return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20";
      default: // Planning
        return "text-zinc-600 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-900/40";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "In Progress": return "bg-indigo-500";
      case "Completed": return "bg-emerald-500";
      case "Paused": return "bg-amber-500";
      default: return "bg-zinc-400"; // Planning
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is inside a button, do not navigate
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(`/dashboard/projects/${project.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300 shadow-sm hover:shadow-md hover:translate-y-[-2px] flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Gradient Border Highlight */}
      <div 
        className="absolute top-0 left-0 right-0 h-[3px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Header (Icon & Category & Quick Actions) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Project Workspace Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                color: accentColor,
                backgroundColor: `${accentColor}12`,
              }}
            >
              <ProjectIcon name={project.icon} size={18} />
            </div>
            {/* Category badge */}
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900/50 px-2 py-0.5 rounded-md border border-zinc-200/20 dark:border-zinc-800/30">
              {project.category}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            {/* Edit Button */}
            <button
              onClick={() => onEdit(project)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              title="Edit Project"
            >
              <Edit2 size={13} />
            </button>

            {/* Archive / Restore Button */}
            <button
              onClick={() => onToggleArchive(project.slug, !project.archived)}
              className={`p-1.5 rounded-lg transition-colors ${
                project.archived
                  ? "text-indigo-500 hover:bg-indigo-500/5"
                  : "text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
              title={project.archived ? "Restore Project" : "Archive Project"}
            >
              <Archive size={13} />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => onDelete(project)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5 transition-colors"
              title="Delete Project"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            {project.title}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[2rem] leading-relaxed">
            {project.description || "No description provided. Add one to outline goals."}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <span>Progress</span>
            <span className="text-indigo-600 dark:text-indigo-400">{project.project_progress || 0}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${project.project_progress || 0}%`,
                backgroundColor: project.color || "#6366f1",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-900/50 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between text-[11px]">
        {/* Status indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold ${getStatusStyle(project.status)}`}>
          <Circle size={6} className={`fill-current ${getStatusDot(project.status)}`} />
          <span>{project.status}</span>
        </div>

        {/* Action / Meta: Favorite Star & Date */}
        <div className="flex items-center gap-3 text-zinc-400 dark:text-zinc-500">
          <button
            onClick={() => onToggleFavorite(project.slug, !project.favorite)}
            className={`p-1 rounded transition-colors ${
              project.favorite
                ? "text-amber-500 hover:text-amber-600"
                : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-500"
            }`}
            title={project.favorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star size={14} className={project.favorite ? "fill-amber-500 text-amber-500" : ""} />
          </button>
          <span className="flex items-center gap-1 text-[10px]">
            <Calendar size={11} />
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}
