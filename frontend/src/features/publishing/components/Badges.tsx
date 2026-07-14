import React from "react";
import * as Icons from "lucide-react";
import { PublishStatus, ApprovalStatus } from "../types";

export function StatusBadge({ status }: { status: PublishStatus }) {
  const styles: Record<PublishStatus, string> = {
    Draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300",
    "In Review": "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    Approved: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30",
    Scheduled: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
    Publishing: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 animate-pulse",
    Published: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    Failed: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
    Archived: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

export function ApprovalBadge({ approvalStatus }: { approvalStatus: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    Pending: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
    Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    Rejected: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[approvalStatus]}`}>
      {approvalStatus}
    </span>
  );
}

export function PlatformBadge({ platformName, icon, color }: { platformName: string; icon: string; color: string }) {
  // Safe dynamic lucide icon rendering
  const LucideIcon = (Icons as any)[icon] || Icons.Globe;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: color }}
    >
      <LucideIcon size={12} />
      {platformName}
    </span>
  );
}
