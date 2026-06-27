"use client";

import React, { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "../../features/identity";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/30 transition-all duration-200"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
          {user?.profile?.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "CP"}
        </div>
        <span className="hidden sm:inline text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {user?.profile?.full_name || "Creator"}
        </span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0c0c0f] shadow-2xl p-1.5 z-50 animate-fadeIn">
          {/* User Details info block */}
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 mb-1.5">
            <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {user?.profile?.full_name || "Digital Creator"}
            </span>
            <span className="block text-[10px] text-zinc-400 truncate">{user?.email}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed select-none">
              <UserIcon size={14} />
              Profile Details
            </div>
            <div className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-zinc-400 dark:text-zinc-600 opacity-60 cursor-not-allowed select-none">
              <Settings size={14} />
              Workspace Settings
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 transition-all text-left"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
