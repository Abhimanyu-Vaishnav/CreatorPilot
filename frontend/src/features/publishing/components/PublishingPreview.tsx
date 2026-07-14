import React from "react";
import * as Icons from "lucide-react";
import { PublishItem } from "../types";

export function PublishingPreview({ item }: { item: PublishItem }) {
  const mediaUrl = item.featured_media_details?.thumbnail_url || item.featured_media_details?.file_url;
  const platform = item.platform_details.name;

  // Render different visual styles based on platforms
  const renderPreview = () => {
    switch (platform) {
      case "YouTube Video":
        return (
          <div className="w-full bg-black rounded-xl overflow-hidden shadow-lg border border-zinc-800">
            {/* Player Frame Mockup */}
            <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <Icons.Video size={48} className="text-red-600 mx-auto" />
                  <span className="block text-[10px] text-zinc-500 font-medium">No Thumbnail Selected</span>
                </div>
              )}
              {/* Play Button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform">
                  <Icons.Play size={20} fill="currentColor" className="ml-1" />
                </div>
              </div>
            </div>
            {/* Metadata Frame */}
            <div className="p-4 bg-zinc-950 text-white space-y-2">
              <h3 className="font-bold text-sm line-clamp-2 leading-snug">
                {item.title || "Video Title Placeholder"}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <span>CreatorPilot Studio</span>
                <span>•</span>
                <span>0 views</span>
                <span>•</span>
                <span>Just now</span>
              </div>
              <div className="pt-2 border-t border-zinc-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs">
                  CP
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-semibold">CreatorPilot</span>
                  <span className="block text-[10px] text-zinc-500">1M subscribers</span>
                </div>
                <button className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-full hover:bg-zinc-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        );

      case "LinkedIn Post":
        return (
          <div className="w-full bg-white dark:bg-[#111217] rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm p-4 space-y-3">
            {/* Post Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                CP
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate hover:underline">
                    {item.owner_username || "Creator Name"}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    • 1st
                  </span>
                </div>
                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">
                  Creator & Content Strategist at CreatorPilot
                </span>
                <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                  Just now • <Icons.Globe size={9} />
                </span>
              </div>
            </div>
            {/* Post Text */}
            <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {item.content || "Write some professional updates..."}
            </p>
            {/* Post Image */}
            {mediaUrl && (
              <div className="w-full overflow-hidden border border-zinc-100 dark:border-zinc-900 rounded-lg">
                <img src={mediaUrl} alt="LinkedIn asset" className="w-full h-auto object-cover max-h-80" />
              </div>
            )}
            {/* Engagement Details */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span className="hover:text-indigo-600">0 Likes</span>
              <span>0 comments • 0 reposts</span>
            </div>
          </div>
        );

      case "X (Twitter) Post":
        return (
          <div className="w-full bg-white dark:bg-[#000000] border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 shadow-sm space-y-3 text-zinc-950 dark:text-zinc-50">
            {/* Header */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                CP
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-zinc-950 dark:text-zinc-50 leading-tight truncate hover:underline">
                  {item.owner_username || "Creator"}
                </span>
                <span className="block text-[10px] text-zinc-500 leading-none truncate">
                  @{item.owner_username?.toLowerCase() || "creatorpilot"}
                </span>
              </div>
              <Icons.Globe size={14} className="text-sky-500 self-start mt-0.5" />
            </div>
            {/* Text */}
            <p className="text-xs whitespace-pre-wrap leading-relaxed">
              {item.content || "What is happening today?!"}
            </p>
            {/* Media */}
            {mediaUrl && (
              <div className="w-full overflow-hidden border border-zinc-200 dark:border-zinc-900 rounded-xl">
                <img src={mediaUrl} alt="X asset" className="w-full h-auto object-cover max-h-80" />
              </div>
            )}
            {/* Footer */}
            <div className="pt-1.5 text-[10px] text-zinc-500 dark:text-zinc-600 flex items-center gap-1 font-medium border-t border-zinc-100 dark:border-zinc-900">
              <span>{new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        );

      case "Instagram Post":
        return (
          <div className="w-full max-w-sm mx-auto bg-white dark:bg-[#000] border border-zinc-200 dark:border-zinc-900 rounded-xl shadow-sm overflow-hidden text-zinc-950 dark:text-zinc-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                  CP
                </div>
                <span className="text-xs font-bold hover:underline">
                  {item.owner_username || "creatorpilot"}
                </span>
              </div>
              <Icons.MoreHorizontal size={14} />
            </div>
            {/* Image Frame */}
            <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Instagram Post" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-2">
                  <Icons.Camera size={36} className="text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <span className="block text-[10px] text-zinc-400 font-medium">No Image Selected</span>
                </div>
              )}
            </div>
            {/* Engagement */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icons.Heart size={16} />
                  <Icons.MessageCircle size={16} />
                  <Icons.Send size={16} />
                </div>
                <Icons.Bookmark size={16} />
              </div>
              {/* Caption */}
              <div className="text-xs leading-relaxed">
                <span className="font-bold mr-1.5">{item.owner_username || "creatorpilot"}</span>
                <span className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{item.content}</span>
              </div>
            </div>
          </div>
        );

      case "Blog Article":
        return (
          <div className="w-full bg-white dark:bg-[#111217] rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden text-zinc-900 dark:text-zinc-50">
            {mediaUrl && (
              <div className="w-full h-48 overflow-hidden">
                <img src={mediaUrl} alt="Article Banner" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                  {item.content_type || "ARTICLE"}
                </span>
                <h1 className="text-lg md:text-xl font-bold tracking-tight leading-tight">
                  {item.title || "Your blog article title placeholder"}
                </h1>
              </div>

              {/* Author Card */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                  CP
                </div>
                <span>By {item.owner_username || "Creator"}</span>
                <span>•</span>
                <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
              </div>

              {item.excerpt && (
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 leading-relaxed border-l-2 border-indigo-500 pl-3">
                  {item.excerpt}
                </p>
              )}

              <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-normal">
                {item.content || "Write some amazing article sections..."}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 text-center space-y-2">
            <Icons.Globe size={24} className="text-zinc-400 mx-auto" />
            <h4 className="text-xs font-bold">{item.title || "No Title"}</h4>
            <p className="text-[11px] text-zinc-500 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {item.content || "No content provided."}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
          Live Mockup Preview
        </span>
        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
          Instantly Synced
        </span>
      </div>
      <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl flex items-center justify-center min-h-[300px]">
        <div className="w-full max-w-md">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
