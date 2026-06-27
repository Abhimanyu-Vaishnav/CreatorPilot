"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { UserMenu } from "./UserMenu";

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
  pageTitle?: string;
}

export function Navbar({ setSidebarOpen, pageTitle = "Dashboard" }: NavbarProps) {
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
        {/* Notification bell mock */}
        <button className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all border border-zinc-200/30 dark:border-zinc-800/30">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
        </button>

        {/* Theme Toggler */}
        <ThemeSwitcher />

        {/* User profile dropdown pill */}
        <UserMenu />
      </div>
    </header>
  );
}
