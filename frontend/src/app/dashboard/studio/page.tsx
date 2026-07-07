"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { useDocumentsQuery } from "../../../features/studio";
import {
  FileText,
  Clock,
  ArrowUpRight,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  FileSignature
} from "lucide-react";

export default function GlobalStudioPage() {
  const { data: allDocuments = [], isLoading } = useDocumentsQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const activeDocs = allDocuments.filter((d) => !d.archived);

  // Stats calculation
  const totalCount = activeDocs.length;
  const draftCount = activeDocs.filter((d) => d.status === "Draft").length;
  const reviewCount = activeDocs.filter((d) => d.status === "Review").length;
  const publishedCount = activeDocs.filter((d) => d.status === "Published").length;

  // Apply filters
  const filteredDocs = activeDocs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.project_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-550">Writing Studio</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Global content studio. Access, search, and manage your blog drafts, video scripts, pins, and newsletters across all workspaces.
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
            <span className="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Total Drafts</span>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">{totalCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">In Editing (Draft)</span>
            <div className="text-xl font-extrabold text-amber-500 mt-1">{draftCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">In Review</span>
            <div className="text-xl font-extrabold text-indigo-500 mt-1">{reviewCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block">Published</span>
            <div className="text-xl font-extrabold text-emerald-500 mt-1">{publishedCount}</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search documents by title or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] text-xs font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
              <option value="Published">Published</option>
            </select>
          </div>
        </div>

        {/* Main List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-650" size={32} />
            <p className="text-xs text-zinc-500 font-medium">Fetching writing documents...</p>
          </div>
        ) : totalCount === 0 ? (
          /* Reused Empty-State Design System */
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800 bg-white/20 dark:bg-[#0e0e11]/25 flex flex-col items-center justify-center max-w-lg mx-auto space-y-4 shadow-sm py-16">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
              <FileSignature size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No documents found</h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-500 max-w-xs mx-auto mt-1.5 leading-relaxed font-semibold">
                You haven't written any documents yet. Open a project workspace to create content plans and begin drafting.
              </p>
            </div>
            <Link
              href="/dashboard/projects"
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
            >
              Select Project Workspace
            </Link>
          </div>
        ) : filteredDocs.length === 0 ? (
          <p className="py-12 text-center text-xs text-zinc-450 dark:text-zinc-550 font-bold">No documents match your query filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold text-xs">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-[#0e0e11] shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/30 hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-200/20 uppercase tracking-wide">
                      {doc.template}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        doc.status === "Published"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : doc.status === "Review"
                          ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate leading-snug">{doc.title}</h3>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
                    Project: <span className="text-zinc-650 dark:text-zinc-300">{doc.project_title}</span>
                  </p>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-medium line-clamp-2 leading-relaxed">
                    {doc.excerpt || "No content written yet."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/60 pt-3">
                  <div className="flex gap-3 text-[10px] text-zinc-450 dark:text-zinc-500 font-bold">
                    <span className="flex items-center gap-1"><FileText size={11} /> {doc.word_count} words</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {doc.reading_time} min</span>
                  </div>
                  <Link
                    href={`/dashboard/projects/${doc.project_slug}?tab=writing`}
                    className="text-[10px] text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold flex items-center gap-0.5 transition-colors"
                  >
                    Open Editor <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
