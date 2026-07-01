"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, Check, Clock, FolderPlus, Edit, Star, Archive, RotateCcw, Eye, Activity } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { UserMenu } from "./UserMenu";
import { useRecentActivityQuery } from "../../features/projects";
import { AnimatePresence, motion } from "framer-motion";

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
  pageTitle?: string;
}

export function Navbar({ setSidebarOpen, pageTitle = "Dashboard" }: NavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [lastViewedTime, setLastViewedTime] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch recent activity
  const { data: recentActivities = [], isLoading } = useRecentActivityQuery();

  // Load last viewed notifications time
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cp_notifications_last_viewed");
      if (stored) {
        setLastViewedTime(parseInt(stored, 10));
      }
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        // Mark as read when closing dropdown
        const now = Date.now();
        setLastViewedTime(now);
        if (typeof window !== "undefined") {
          localStorage.setItem("cp_notifications_last_viewed", now.toString());
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute unread count
  const unreadCount = recentActivities.filter(
    (act) => new Date(act.created_at).getTime() > lastViewedTime
  ).length;

  const handleOpenDropdown = () => {
    const nextState = !dropdownOpen;
    setDropdownOpen(nextState);
    
    // Mark as read only when CLOSING the dropdown
    if (!nextState) {
      const now = Date.now();
      setLastViewedTime(now);
      if (typeof window !== "undefined") {
        localStorage.setItem("cp_notifications_last_viewed", now.toString());
      }
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    setLastViewedTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem("cp_notifications_last_viewed", now.toString());
    }
  };

  const handleNotificationClick = (projectSlug: string) => {
    setDropdownOpen(false);
    // Mark as read when navigating
    const now = Date.now();
    setLastViewedTime(now);
    if (typeof window !== "undefined") {
      localStorage.setItem("cp_notifications_last_viewed", now.toString());
    }
    router.push(`/dashboard/projects/${projectSlug}`);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Project Created":
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <FolderPlus size={11} className="text-emerald-500" />
          </div>
        );
      case "Project Updated":
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Edit size={11} className="text-blue-500" />
          </div>
        );
      case "Favorite Added":
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Star size={11} className="text-amber-500 fill-amber-500" />
          </div>
        );
      case "Favorite Removed":
        return (
          <div className="w-6 h-6 rounded-full bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center flex-shrink-0">
            <Star size={11} className="text-zinc-500" />
          </div>
        );
      case "Archived":
        return (
          <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
            <Archive size={11} className="text-rose-500" />
          </div>
        );
      case "Restored":
        return (
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <RotateCcw size={11} className="text-emerald-500" />
          </div>
        );
      case "Project Opened":
        return (
          <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Eye size={11} className="text-indigo-500" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center flex-shrink-0">
            <Activity size={11} className="text-zinc-500" />
          </div>
        );
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "Project Created":
        return "created a new workspace";
      case "Project Updated":
        return "updated workspace details";
      case "Favorite Added":
        return "added project to favorites";
      case "Favorite Removed":
        return "removed project from favorites";
      case "Archived":
        return "archived the workspace";
      case "Restored":
        return "restored workspace from archives";
      case "Project Opened":
        return "opened project workspace";
      default:
        return action;
    }
  };

  return (
    <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/50 bg-white/50 dark:bg-[#08080a]/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>
        
        {/* Workspace Title Context */}
        <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpenDropdown}
            className={`relative p-2 rounded-lg transition-all border outline-none active:scale-[0.97] ${
              dropdownOpen
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200/30 dark:border-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-rose-600 text-white dark:bg-rose-500 rounded-full ring-1.5 ring-white dark:ring-[#08080a] flex items-center justify-center text-[9px] font-black font-sans leading-none animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Panel */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white/95 dark:bg-[#0c0c0f]/95 shadow-2xl backdrop-blur-md overflow-hidden z-50 flex flex-col max-h-[400px]"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900/60 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/10">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Check size={10} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900/40">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                      <Loader2 size={16} className="animate-spin text-zinc-400" />
                      <span className="text-[10px] text-zinc-400">Loading alerts...</span>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="py-12 text-center space-y-1.5">
                      <Bell size={20} className="mx-auto text-zinc-300 dark:text-zinc-700" />
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">All caught up!</p>
                      <p className="text-[10px] text-zinc-400">Activity in project workspaces will show up here.</p>
                    </div>
                  ) : (
                    recentActivities.slice(0, 10).map((act) => {
                      const isUnread = new Date(act.created_at).getTime() > lastViewedTime;
                      return (
                        <div
                          key={act.id}
                          onClick={() => handleNotificationClick(act.project_slug)}
                          className={`p-3.5 flex gap-3 text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer relative ${
                            isUnread ? "bg-indigo-600/[0.02] dark:bg-indigo-500/[0.01]" : ""
                          }`}
                        >
                          {/* Left dot for unread status */}
                          {isUnread && (
                            <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          )}
                          
                          {/* Activity Icon */}
                          {getActionIcon(act.action)}

                          {/* Message Body */}
                          <div className="space-y-1 pr-2 flex-1">
                            <p className="leading-snug text-zinc-700 dark:text-zinc-300 font-medium">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{act.username} </span>
                              {getActionText(act.action)} on{" "}
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{act.project_title}</span>
                            </p>
                            
                            <div className="flex items-center gap-1 text-[9px] text-zinc-400 font-semibold">
                              <Clock size={9} />
                              <span>{act.relative_time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-900/60 text-center bg-zinc-50/30 dark:bg-zinc-900/5">
                  <Link
                    href="/dashboard/projects"
                    onClick={() => setDropdownOpen(false)}
                    className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  >
                    View All Projects
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggler */}
        <ThemeSwitcher />

        {/* User profile dropdown pill */}
        <UserMenu />
      </div>
    </header>
  );
}

// Inline Loader helper icon
function Loader2({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
