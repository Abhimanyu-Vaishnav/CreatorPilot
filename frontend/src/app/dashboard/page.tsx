"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useAuth } from "../../features/identity";
import { User, ShieldCheck, Database, Calendar, Video, Bookmark, Globe, Check, Loader2, Save } from "lucide-react";

export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  
  // Local profile state for form
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [youtube, setYoutube] = useState("");
  const [pinterest, setPinterest] = useState("");
  const [website, setWebsite] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields once user is loaded
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || "");
      setBio(user.profile.bio || "");
      setYoutube(user.profile.youtube_handle || "");
      setPinterest(user.profile.pinterest_handle || "");
      setWebsite(user.profile.website_url || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      await updateProfile({
        full_name: fullName,
        bio: bio,
        youtube_handle: youtube,
        pinterest_handle: pinterest,
        website_url: website || null,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError("Failed to update profile. Please ensure input fields are valid.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Creator Dashboard</h1>
        <p className="text-xs text-zinc-500 mt-1">Foundational workspace. Customize your creator profile to connect distribution channels.</p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Editing Form Component */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
            <User className="text-indigo-600 dark:text-indigo-400" size={18} />
            <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Creator Profile Details</h2>
          </div>

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://janedoe.com"
                  className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Biography / Description
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a brief details about your content domains, goals, or targets..."
                rows={3}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  YouTube handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[10px] text-zinc-500 font-semibold">youtube.com/</span>
                  <input
                    type="text"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="@janedoe"
                    className="w-full h-10 pl-24 pr-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Pinterest handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-[10px] text-zinc-500 font-semibold">pinterest.com/</span>
                  <input
                    type="text"
                    value={pinterest}
                    onChange={(e) => setPinterest(e.target.value)}
                    placeholder="janedoe"
                    className="w-full h-10 pl-24 pr-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-75 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    Profile Updated
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Info Sidebar (DB status, channel connection checklists) */}
        <div className="space-y-6">
          {/* JWT Security Status Card */}
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={18} />
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Security Credentials</h3>
            </div>
            
            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                <span className="text-zinc-500">Auth Token Type</span>
                <span className="font-semibold">JWT Bearer</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-900/30">
                <span className="text-zinc-500">Role Authority</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Authenticated Creator</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-zinc-500">Database Engine</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <Database size={12} className="text-zinc-400" />
                  SQLite Fallback
                </span>
              </div>
            </div>
          </div>

          {/* Connected Profiles Progress checklist */}
          <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Channel Integration Checklist</h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5">
                  <Video size={16} className={youtube ? "text-indigo-600" : "text-zinc-400"} />
                  YouTube Channel
                </span>
                <span className={`text-[10px] font-semibold ${youtube ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                  {youtube ? "Configured" : "Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5">
                  <Bookmark size={16} className={pinterest ? "text-indigo-600" : "text-zinc-400"} />
                  Pinterest Board
                </span>
                <span className={`text-[10px] font-semibold ${pinterest ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                  {pinterest ? "Configured" : "Missing"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2.5">
                  <Globe size={16} className={website ? "text-indigo-600" : "text-zinc-400"} />
                  Personal Blog
                </span>
                <span className={`text-[10px] font-semibold ${website ? "text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded" : "text-zinc-400"}`}>
                  {website ? "Configured" : "Missing"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
