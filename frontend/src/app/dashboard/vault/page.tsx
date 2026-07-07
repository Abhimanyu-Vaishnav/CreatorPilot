"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { useKnowledgeQuery, getKnowledgeTypeIcon } from "../../../features/vault";
import {
  Clock,
  ArrowUpRight,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  Database,
  Star,
  ExternalLink,
  BookOpen
} from "lucide-react";

export default function GlobalVaultPage() {
  const { data: allItems = [], isLoading } = useKnowledgeQuery();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const activeItems = allItems.filter((k) => !k.archived);

  // Stats calculation
  const totalCount = activeItems.length;
  const favoriteCount = activeItems.filter((k) => k.favorite).length;
  const linkCount = activeItems.filter((k) => k.type === "Website" || k.type === "Video Link").length;
  const docCount = activeItems.filter((k) => k.type === "Document" || k.type === "Research Note").length;

  // Apply filters
  const filteredItems = activeItems.filter((k) => {
    const matchesSearch =
      k.title.toLowerCase().includes(search.toLowerCase()) ||
      k.project_title.toLowerCase().includes(search.toLowerCase()) ||
      (k.description && k.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "All" || k.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-550">Knowledge Vault</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Global research vault. Track websites, video bookmarks, snippets, and document references aggregated across workspaces.
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="h-9 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-all self-start md:self-auto"
          >
            Open Project Workspace <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-semibold">
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Vault Items</span>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-550 mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Starred References</span>
            <div className="text-xl font-extrabold text-amber-500 mt-1 flex items-center gap-1">
              <Star size={16} className="fill-amber-550 text-amber-500" /> {favoriteCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Research Links</span>
            <div className="text-xl font-extrabold text-indigo-500 mt-1">{linkCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Documents</span>
            <div className="text-xl font-extrabold text-emerald-500 mt-1">{docCount}</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by title, project, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Research Note">Research Note</option>
              <option value="Website">Website</option>
              <option value="Video Link">Video Link</option>
              <option value="Document">Document</option>
              <option value="Checklist">Checklist</option>
              <option value="Snippet">Snippet</option>
            </select>
          </div>
        </div>

        {/* Main List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-650" size={32} />
            <p className="text-xs text-zinc-500 font-medium">Fetching Knowledge Vault items...</p>
          </div>
        ) : totalCount === 0 ? (
          /* Reused Empty-State Design System */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm py-16">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <Database size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No knowledge items</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed font-semibold">
                Your research archive is empty. Select a project workspace to add websites, bookmarks, or guides.
              </p>
            </div>
            <Link
              href="/dashboard/projects"
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              Select Project Workspace
            </Link>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="py-12 text-center text-xs text-zinc-450 dark:text-zinc-550 font-bold">No knowledge items match your query filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-xs">
            {filteredItems.map((item) => {
              const TypeIcon = getKnowledgeTypeIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/30 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-wide">
                        <TypeIcon size={10} /> {item.type}
                      </span>
                      {item.favorite && (
                        <Star size={14} className="fill-amber-500 text-amber-550" />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate leading-snug">{item.title}</h3>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                      Project: <span className="text-zinc-650 dark:text-zinc-300">{item.project_title}</span>
                    </p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-medium line-clamp-2 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/60 pt-3">
                    <div className="text-[10px] text-zinc-400 font-bold">
                      {item.source_url ? (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                        >
                          Visit Link <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1"><BookOpen size={10} /> Workspace File</span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/projects/${item.project_slug}?tab=vault`}
                      className="text-[10px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-bold flex items-center gap-0.5 transition-colors"
                    >
                      Open Vault <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
