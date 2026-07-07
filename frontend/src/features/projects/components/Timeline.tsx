"use client";

import React from "react";
import { ProjectActivity } from "../types";
import {
  FolderPlus,
  Edit,
  Star,
  Archive,
  RotateCcw,
  Eye,
  Activity,
  User,
  Clock,
  FileText,
  Trash2
} from "lucide-react";

interface TimelineProps {
  activities: ProjectActivity[];
  isLoading?: boolean;
}

export function Timeline({ activities, isLoading = false }: TimelineProps) {
  const getActionConfig = (activity: ProjectActivity) => {
    const action = activity.action;
    switch (action) {
      case "Document Created":
        return {
          icon: FileText,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          text: `created document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Document Updated":
        return {
          icon: Edit,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          text: `updated document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Document Opened":
        return {
          icon: Eye,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          text: `opened document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Document Status Changed":
        return {
          icon: Activity,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          text: `changed status of "${activity.metadata?.document_title || "Untitled"}" to ${activity.metadata?.new_status || "Draft"}`,
        };
      case "Document Deleted":
        return {
          icon: Trash2,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          text: `deleted document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Document Archived":
        return {
          icon: Archive,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          text: `archived document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Document Restored":
        return {
          icon: RotateCcw,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          text: `restored document "${activity.metadata?.document_title || "Untitled"}"`,
        };
      case "Project Created":
        return {
          icon: FolderPlus,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          text: "created this project workspace",
        };
      case "Project Updated":
        return {
          icon: Edit,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
          text: "updated project settings",
        };
      case "Favorite Added":
        return {
          icon: Star,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          text: "added project to favorites",
          iconFill: "fill-amber-500",
        };
      case "Favorite Removed":
        return {
          icon: Star,
          color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
          text: "removed project from favorites",
        };
      case "Archived":
        return {
          icon: Archive,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          text: "archived project workspace",
        };
      case "Restored":
        return {
          icon: RotateCcw,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          text: "restored project workspace from archives",
        };
      case "Project Opened":
        return {
          icon: Eye,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          text: "opened project workspace",
        };
      default:
        return {
          icon: Activity,
          color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
          text: action,
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-3/4" />
              <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
        <Activity size={24} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-2" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-4 border-l border-zinc-100 dark:border-zinc-900 space-y-6 py-2">
      {activities.map((activity, index) => {
        const config = getActionConfig(activity);
        const Icon = config.icon;
        
        // Clean timestamp formatting
        const formattedDate = new Date(activity.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div key={activity.id || index} className="relative group">
            {/* Timeline Dot Connector Indicator */}
            <div className="absolute top-1 left-[-25px] flex items-center justify-center">
              <div
                className={`w-7 h-7 rounded-full border flex items-center justify-center shadow-sm transition-all duration-300 ${config.color}`}
              >
                <Icon size={12} className={config.iconFill || ""} />
              </div>
            </div>

            {/* Event Description Card */}
            <div className="pl-2 space-y-1">
              <div className="flex items-center flex-wrap gap-x-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <User size={11} className="text-zinc-400" />
                  {activity.username || "You"}
                </span>
                <span>{config.text}</span>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1 font-semibold">
                  <Clock size={10} />
                  {activity.relative_time}
                </span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
