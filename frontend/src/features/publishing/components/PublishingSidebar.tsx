import React from "react";
import * as Icons from "lucide-react";
import { usePlatformsQuery } from "../hooks/usePublishing";
import { useProjectsQuery } from "../../projects";

interface PublishingSidebarProps {
  currentStatus: string;
  setStatus: (status: string) => void;
  currentPlatform: string;
  setPlatform: (platformId: string) => void;
  currentProject: string;
  setProject: (projectId: string) => void;
}

export function PublishingSidebar({
  currentStatus,
  setStatus,
  currentPlatform,
  setPlatform,
  currentProject,
  setProject
}: PublishingSidebarProps) {
  const { data: platforms } = usePlatformsQuery();
  const { data: projectsData } = useProjectsQuery();
  const projects = projectsData?.results || [];

  const statuses = [
    { name: "All Work", value: "", icon: Icons.Layers },
    { name: "Drafts", value: "Draft", icon: Icons.FileText },
    { name: "In Review", value: "In Review", icon: Icons.Eye },
    { name: "Approved", value: "Approved", icon: Icons.CheckCircle },
    { name: "Scheduled", value: "Scheduled", icon: Icons.Calendar },
    { name: "Published", value: "Published", icon: Icons.Globe },
    { name: "Archived", value: "Archived", icon: Icons.Archive },
  ];

  return (
    <div className="w-full md:w-64 space-y-6">
      {/* Workflow States */}
      <div className="space-y-1">
        <h3 className="px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
          Workflow Status
        </h3>
        <div className="mt-2 space-y-1">
          {statuses.map((item) => {
            const Icon = item.icon;
            const isSelected = currentStatus === item.value;
            return (
              <button
                key={item.name}
                onClick={() => setStatus(item.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
                }`}
              >
                <Icon size={14} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platforms Filter */}
      <div className="space-y-1">
        <h3 className="px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
          Platforms
        </h3>
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => setPlatform("")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              currentPlatform === ""
                ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Icons.Layers size={14} />
            <span>All Platforms</span>
          </button>
          {platforms?.map((plat) => {
            const Icon = (Icons as any)[plat.icon] || Icons.Globe;
            const isSelected = currentPlatform === plat.name;
            return (
              <button
                key={plat.id}
                onClick={() => setPlatform(plat.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: plat.color }}
                />
                <Icon size={12} style={{ color: plat.color }} />
                <span>{plat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Filter */}
      <div className="space-y-1">
        <h3 className="px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
          Filter by Project
        </h3>
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => setProject("")}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              currentProject === ""
                ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Icons.FolderKanban size={14} />
            <span>All Projects</span>
          </button>
          {projects.map((proj) => {
            const isSelected = currentProject === proj.slug;
            return (
              <button
                key={proj.id}
                onClick={() => setProject(proj.slug)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: proj.color }}
                />
                <span className="truncate">{proj.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
