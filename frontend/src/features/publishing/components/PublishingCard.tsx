import React from "react";
import * as Icons from "lucide-react";
import { PublishItem } from "../types";
import { StatusBadge } from "./Badges";

interface PublishingCardProps {
  item: PublishItem;
  onClick: (item: PublishItem) => void;
  isSelected?: boolean;
}

export function PublishingCard({ item, onClick, isSelected }: PublishingCardProps) {
  const IconComponent = (Icons as any)[item.platform_details.icon] || Icons.Globe;
  const formattedDate = item.scheduled_at
    ? new Date(item.scheduled_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  return (
    <div
      onClick={() => onClick(item)}
      className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-500/50 shadow-md shadow-indigo-600/5"
          : "bg-white dark:bg-[#0c0c0f] border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: item.platform_details.color }}
          >
            <IconComponent size={15} />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              {item.platform_details.name}
            </span>
            <span className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {item.project_title}
            </span>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <h4 className="mt-3 font-semibold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {item.title}
      </h4>

      {item.excerpt && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {item.excerpt}
        </p>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
            {item.owner_username?.substring(0, 2).toUpperCase() || "CP"}
          </div>
          <span>{item.owner_username || "Creator"}</span>
        </div>

        {formattedDate ? (
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Icons.Calendar size={11} />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <span>
            Edited {new Date(item.updated_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
