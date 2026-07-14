import React from "react";
import * as Icons from "lucide-react";

interface PublishingToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  ordering: string;
  setOrdering: (order: string) => void;
  onCreateNew: () => void;
}

export function PublishingToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  ordering,
  setOrdering,
  onCreateNew
}: PublishingToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 justify-between p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl">
      {/* Search Field */}
      <div className="relative w-full sm:w-72">
        <Icons.Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
        <input
          type="text"
          placeholder="Search drafts, platforms, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900 dark:text-zinc-50"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
        {/* Sorting Selection */}
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5">
          <Icons.SlidersHorizontal size={13} className="text-zinc-400" />
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="bg-transparent text-xs font-semibold focus:outline-none text-zinc-700 dark:text-zinc-300 border-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="scheduled">Scheduled Date</option>
            <option value="published">Published Date</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="recently_edited">Recently Edited</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <Icons.Grid size={13} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            }`}
          >
            <Icons.List size={13} />
          </button>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
        >
          <Icons.Plus size={14} />
          <span>New Post</span>
        </button>
      </div>
    </div>
  );
}
