"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  projectName?: string;
  projectColor?: string;
  customBreadcrumbs?: BreadcrumbItem[];
}

export function Breadcrumbs({ projectName, projectColor = "#6366f1", customBreadcrumbs }: BreadcrumbsProps) {
  if (customBreadcrumbs) {
    return (
      <nav className="flex items-center space-x-1.5 text-xs text-zinc-500 font-semibold mb-4" aria-label="Breadcrumb">
        {customBreadcrumbs.map((crumb, idx) => {
          const isLast = idx === customBreadcrumbs.length - 1;
          const isHome = idx === 0 && (crumb.label === "Dashboard" || crumb.href === "/dashboard");

          return (
            <React.Fragment key={crumb.label}>
              {idx > 0 && (
                <ChevronRight size={12} className="text-zinc-400 dark:text-zinc-600" />
              )}
              {isLast ? (
                <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  {isHome && <Home size={13} />}
                  <span className="truncate max-w-[200px] font-bold">{crumb.label}</span>
                </div>
              ) : (
                <Link
                  href={crumb.href}
                  className="flex items-center gap-1 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                >
                  {isHome && <Home size={13} />}
                  <span>{crumb.label}</span>
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  }

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
