import React from "react";
import * as Icons from "lucide-react";
import { PublishItem } from "../types";

interface SEOCardProps {
  seoTitle: string;
  setSeoTitle: (title: string) => void;
  seoDescription: string;
  setSeoDescription: (desc: string) => void;
  canonicalUrl: string;
  setCanonicalUrl: (url: string) => void;
  slug: string;
}

export function SEOCard({
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  canonicalUrl,
  setCanonicalUrl,
  slug
}: SEOCardProps) {
  return (
    <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-4">
      <div className="flex items-center gap-2">
        <Icons.Search size={14} className="text-zinc-500" />
        <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          SEO & Meta Details
        </h4>
      </div>

      {/* Google Preview Mockup */}
      <div className="bg-white dark:bg-[#0c0c0f] p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
        <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
          Google Search Preview
        </span>
        <span className="block text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
          https://creatorpilot.com/posts/{slug || "sample-post"}
        </span>
        <span className="block text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5 truncate hover:underline">
          {seoTitle || "Meta Title Placeholder"}
        </span>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
          {seoDescription || "Please provide meta description copy. Optimize for click through rate by summarizing key ideas..."}
        </p>
      </div>

      {/* Input Fields */}
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            SEO Title
          </label>
          <input
            type="text"
            placeholder="SEO Meta Title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            SEO Description
          </label>
          <textarea
            placeholder="SEO Meta Description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
            Canonical URL
          </label>
          <input
            type="url"
            placeholder="https://example.com/canonical-url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
