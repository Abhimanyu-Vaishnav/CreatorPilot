"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  FileText,
  Calendar,
  Settings,
  Sparkles,
  Cpu,
  Video,
  Bookmark,
  Globe,
  Plus
} from "lucide-react";
import { useAuth } from "../../features/identity";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAiEnabled?: boolean;
  setIsAiEnabled?: (enabled: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen, isAiEnabled = true, setIsAiEnabled }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban, disabled: true },
    { name: "Knowledge Vault", href: "/dashboard/vault", icon: Database, disabled: true },
    { name: "Writing Studio", href: "/dashboard/studio", icon: FileText, disabled: true },
    { name: "Content Planner", href: "/dashboard/planner", icon: Calendar, disabled: true },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200/60 dark:border-zinc-800/50 bg-white/80 dark:bg-[#0c0c0f]/85 backdrop-blur-xl transition-transform duration-300 transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-zinc-200/60 dark:border-zinc-800/50">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold text-sm tracking-wide">
            CP
          </div>
          <div>
            <span className="font-bold tracking-tight text-zinc-950 dark:text-zinc-50">CreatorPilot</span>
            <span className="block text-[10px] text-zinc-500 font-medium tracking-wider uppercase">OS for Creators</span>
          </div>
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.disabled) {
            // Future placeholder module styling (locked style for Day 1 scope)
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed select-none"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.name}
                </span>
                <span className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/30 px-1.5 py-0.5 rounded text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                  Locked
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant Module Control Toggle */}
      {setIsAiEnabled && (
        <div className="mx-4 my-2 p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Sparkles size={14} className="text-indigo-500 animate-pulse" />
              AI Copilot
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAiEnabled}
                onChange={() => setIsAiEnabled(!isAiEnabled)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-3 after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
            {isAiEnabled ? "AI Smart Suggestions Active." : "AI assistant disabled. Works in manual mode."}
          </p>
        </div>
      )}

      {/* Settings Link at Bottom (above profile card) */}
      <div className="px-4 mt-2">
        <div className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed select-none">
          <span className="flex items-center gap-3">
            <Settings size={18} />
            Settings
          </span>
          <span className="text-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/30 px-1.5 py-0.5 rounded text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
            Locked
          </span>
        </div>
      </div>

      {/* User profile details at bottom */}
      <div className="absolute bottom-0 w-full p-4 border-t border-zinc-200/60 dark:border-zinc-800/50 flex items-center gap-3 bg-zinc-50/50 dark:bg-[#0c0c0f]/20">
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {user?.profile?.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "CP"}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {user?.profile?.full_name || "New Creator"}
          </span>
          <span className="block text-[10px] text-zinc-500 truncate">{user?.email}</span>
        </div>
      </div>
    </aside>
  );
}
