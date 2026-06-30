"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbsProps {
  projectName?: string;
  projectColor?: string;
}

export function Breadcrumbs({ projectName, projectColor = "#6366f1" }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 font-semibold mb-4" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
      >
        <Home size={13} />
        <span>Dashboard</span>
      </Link>
      
      <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-600" />
      
      <Link
        href="/dashboard/projects"
        className="hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
      >
        Projects
      </Link>
      
      {projectName && (
        <>
          <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-600" />
          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: projectColor }}
            />
            <span className="truncate max-w-[200px] font-bold">{projectName}</span>
          </div>
        </>
      )}
    </nav>
  );
}
