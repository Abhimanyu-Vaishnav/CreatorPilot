"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  Pin,
  Archive,
  Trash2,
  ExternalLink,
  MoreVertical,
  ChevronRight,
  Link2,
} from "lucide-react";
import { KnowledgeItem } from "../types";
import { getKnowledgeTypeIcon } from "./KnowledgeWorkspace";

interface KnowledgeCardProps {
  item: KnowledgeItem;
  projectSlug: string;
  onToggleFavorite: (slug: string, favorite: boolean) => Promise<void>;
  onTogglePin: (slug: string, pinned: boolean) => Promise<void>;
  onToggleArchive: (slug: string, archived: boolean) => Promise<void>;
  onDelete: (slug: string) => Promise<void>;
  onEdit: (item: KnowledgeItem) => void;
}

export function KnowledgeCard({
  item,
  projectSlug,
  onToggleFavorite,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onEdit,
}: KnowledgeCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const Icon = getKnowledgeTypeIcon(item.type);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(item.slug, !item.favorite);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin(item.slug, !item.pinned);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setShowDropdown(false);
  };

  const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e0e11] hover:border-indigo-500/30 hover:shadow-sm dark:hover:border-indigo-400/20 transition-all font-sans p-5 flex flex-col justify-between h-[180px]">
      
      {/* Top row: Type Icon, Pinned/Starred indicators, and Dropdown */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Icon size={15} />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
            {item.type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {item.pinned && (
            <button
              onClick={handlePinClick}
              className="p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-indigo-650 dark:text-indigo-400"
              title="Pinned to top"
            >
              <Pin size={12} className="fill-indigo-500/20" />
            </button>
          )}
          {item.favorite && (
            <button
              onClick={handleFavoriteClick}
              className="p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-amber-500"
              title="Starred resource"
            >
              <Star size={12} className="fill-amber-500" />
            </button>
          )}

          {/* Quick Actions More Button */}
          <div className="relative">
            <button
              onClick={handleDropdownToggle}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <MoreVertical size={14} />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] shadow-lg py-1.5 z-20 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  <button
                    onClick={(e) => handleActionClick(e, () => onEdit(item))}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    Edit Resource
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, () => onToggleFavorite(item.slug, !item.favorite))}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
                  >
                    {item.favorite ? "Unstar Favorite" : "Star Favorite"}
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, () => onTogglePin(item.slug, !item.pinned))}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-between"
                  >
                    {item.pinned ? "Unpin Item" : "Pin to Top"}
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, () => onToggleArchive(item.slug, !item.archived))}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    {item.archived ? "Restore Item" : "Archive Item"}
                  </button>
                  <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1" />
                  <button
                    onClick={(e) => handleActionClick(e, () => onDelete(item.slug))}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-500/5 text-rose-500 transition-colors"
                  >
                    Delete Resource
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle row: Title & Excerpt */}
      <div className="flex-1 min-w-0 mt-3.5 space-y-1">
        <Link
          href={`/dashboard/projects/${projectSlug}/knowledge/${item.slug}`}
          className="font-bold text-xs text-zinc-950 dark:text-zinc-50 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors truncate block"
        >
          {item.title}
        </Link>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-2 font-medium">
          {item.description || "No description provided."}
        </p>
      </div>

      {/* Bottom row: Tags list, linked note status & URL info */}
      <div className="mt-3.5 pt-3.5 border-t border-zinc-100 dark:border-zinc-900/40 flex items-center justify-between min-w-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.note_reference && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-250/20 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0"
              title={`Linked to Note: ${item.note_title}`}
            >
              <Link2 size={10} />
              Linked
            </div>
          )}
          
          {/* Tags list */}
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            {item.tags && item.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-450 border border-zinc-200/10 text-[9px] font-semibold truncate max-w-[80px]"
              >
                #{t}
              </span>
            ))}
            {item.tags && item.tags.length > 2 && (
              <span className="text-[9px] font-bold text-zinc-400 flex-shrink-0">
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Date and External URL Link */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
            {createdDate}
          </span>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-600 transition-colors border border-zinc-200/10"
              title="Open Source Link"
            >
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
