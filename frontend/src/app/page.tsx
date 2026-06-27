"use client";

import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  Bookmark,
  Sparkles,
  TrendingUp,
  Cpu,
  Settings as SettingsIcon,
  User,
  Search,
  Bell,
  Plus,
  ChevronRight,
  Globe,
  Video,
  Menu,
  X,
  ArrowRight,
  Lock,
  Loader2,
  ListFilter
} from "lucide-react";

// Mock Data
const INITIAL_TASKS = [
  { id: "1", title: "Write YouTube Script: React 19 Core Features", project: "YouTube Channel", status: "In Progress", priority: "High" },
  { id: "2", title: "Design Pinterest pins for Blog promo", project: "SaaS Launch", status: "Todo", priority: "Medium" },
  { id: "3", title: "Outline SEO keywords for CreatorPilot Blog", project: "SEO Workspace", status: "Done", priority: "Low" },
];

const INITIAL_NOTES = [
  { id: "1", title: "Launch Strategy & Brand Voice guidelines", tags: ["launch", "marketing"], updated: "2 hours ago" },
  { id: "2", title: "YouTube hooks & retention patterns spreadsheet", tags: ["youtube", "reference"], updated: "1 day ago" },
  { id: "3", title: "Domain Bounded Context mapping notes", tags: ["architecture", "DDD"], updated: "3 days ago" },
];

const SOCIAL_CHANNELS = [
  { name: "YouTube", icon: Video, color: "text-red-500 bg-red-500/10", followers: "42.8K", status: "Connected" },
  { name: "Pinterest", icon: Bookmark, color: "text-rose-600 bg-rose-600/10", followers: "112K", status: "Connected" },
  { name: "Creator Blog", icon: Globe, color: "text-emerald-500 bg-emerald-500/10", followers: "12.5K", status: "Connected" }
];

export default function Home() {
  // Navigation & Interactive States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tasks state
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("YouTube Channel");

  // Writing Studio live editing state
  const [editorText, setEditorText] = useState(
    "Developing a SaaS application can be daunting, but with CreatorPilot as your creator operating system, managing notes, projects, bookmarks, tasks, and planning social media publication schedules happens in one unified dashboard..."
  );

  // Search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  // AI Assistant Dynamic suggestions
  const aiSuggestion = useMemo(() => {
    if (!isAiEnabled) return null;
    const words = editorText.trim().split(/\s+/).length;
    if (words < 10) return "Start typing more to get contextual suggestions...";
    if (editorText.toLowerCase().includes("saas")) {
      return "💡 Suggestion: CreatorPilot leverages Domain-Driven Design (DDD) to keep its writing, publishing, and note workspaces decoupled, ensuring sub-second interface responses.";
    }
    return "💡 Contextual Tip: Break this paragraph into bullet points to increase readability for blog post platforms.";
  }, [editorText, isAiEnabled]);

  const wordCount = useMemo(() => {
    return editorText.trim() === "" ? 0 : editorText.trim().split(/\s+/).length;
  }, [editorText]);

  // Add tasks
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newId = (tasks.length + 1).toString();
    setTasks([
      ...tasks,
      { id: newId, title: newTaskTitle, project: newTaskProject, status: "Todo", priority: "Medium" }
    ]);
    setNewTaskTitle("");
  };

  // Toggle tasks status
  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const nextStatus = task.status === "Done" ? "Todo" : "Done";
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 dark:bg-[#070709] dark:text-zinc-100 transition-colors duration-200">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200/60 dark:border-zinc-800/50 bg-white/80 dark:bg-[#0c0c0f]/80 backdrop-blur-xl transition-transform duration-300 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200/60 dark:border-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold text-sm tracking-wide">
              CP
            </div>
            <div>
              <span className="font-bold tracking-tight text-zinc-950 dark:text-zinc-50">CreatorPilot</span>
              <span className="block text-[10px] text-zinc-500 font-medium tracking-wider uppercase">OS for Creators</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <X size={18} />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "projects"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <FolderKanban size={18} />
              Projects
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "projects" ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
              {tasks.filter(t => t.status !== "Done").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "vault"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
            }`}
          >
            <Database size={18} />
            Knowledge Vault
          </button>

          <button
            onClick={() => setActiveTab("studio")}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "studio"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
            }`}
          >
            <FileText size={18} />
            Writing Studio
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`flex w-full items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "planner"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-zinc-50"
            }`}
          >
            <CalendarIcon size={18} />
            Content Planner
          </button>
        </nav>

        {/* AI Assistant Module Control Toggle */}
        <div className="mx-4 my-2 p-3.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              <Sparkles size={14} className="text-indigo-500 animate-pulse" />
              AI Copilot
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isAiEnabled}
                onChange={() => setIsAiEnabled(!isAiEnabled)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-3 after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
            {isAiEnabled ? "Smart completion & SEO recommendations active." : "AI assistant disabled. Standard editing model active."}
          </p>
        </div>

        {/* User profile details at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-200/60 dark:border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
              JD
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">Jane Doe</span>
              <span className="block text-[10px] text-zinc-500">Solo Creator Tier</span>
            </div>
          </div>
          <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <SettingsIcon size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex flex-col flex-1 lg:pl-64">
        
        {/* HEADER BAR */}
        <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/50 bg-white/50 dark:bg-[#08080a]/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-64 md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tasks, notes, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 text-xs border-transparent focus:bg-white dark:focus:bg-[#0c0c0f] focus:border-zinc-200 dark:focus:border-zinc-800 outline-none transition-all placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </button>
            
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/10 text-white rounded-lg transition-all">
              <Plus size={14} />
              New Draft
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto fade-in">
          
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <>
              {/* Header Titles */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Creator Dashboard</h1>
                  <p className="text-xs text-zinc-500 mt-1">Unified view of your notes, calendar schedules, tasks, and media assets.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Backend Health Check: OK
                  </span>
                </div>
              </div>

              {/* Top Quick Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] hover:shadow-lg dark:hover:shadow-zinc-900/10 transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Projects</span>
                    <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <FolderKanban size={16} />
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">4</span>
                    <span className="text-xs text-emerald-500 font-semibold flex items-center">
                      +1 new
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] hover:shadow-lg dark:hover:shadow-zinc-900/10 transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Scheduled Posts</span>
                    <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <CalendarIcon size={16} />
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">12</span>
                    <span className="text-xs text-zinc-400">Across 3 channels</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] hover:shadow-lg dark:hover:shadow-zinc-900/10 transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Vault Bookmarks</span>
                    <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                      <Bookmark size={16} />
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">87</span>
                    <span className="text-xs text-zinc-400">Auto-tagged</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] hover:shadow-lg dark:hover:shadow-zinc-900/10 transition-shadow">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Storage Limit</span>
                    <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                      <Database size={16} />
                    </span>
                  </div>
                  <div className="mt-3">
                    <span className="text-lg font-bold">142.5 MB / 1 GB</span>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                      <div className="w-[14%] h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Modules Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1 & 2: WRITING STUDIO PREVIEW & TASKS */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* WRITING STUDIO CARD */}
                  <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-indigo-500" />
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Writing Studio Editor</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400 font-medium">Read time: {Math.ceil(wordCount / 200)} min</span>
                        <span className="text-[10px] text-zinc-400 font-medium">Words: {wordCount}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        className="w-full min-h-[140px] p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 rounded-xl text-xs leading-relaxed outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 resize-none font-sans"
                      />
                    </div>

                    {/* Interactive AI panel - only visible if AI enabled */}
                    {isAiEnabled ? (
                      <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-start gap-2.5 animate-fadeIn">
                        <Sparkles size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                        <p>{aiSuggestion}</p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-zinc-500/5 border border-zinc-200/30 dark:border-zinc-800/30 text-[11px] text-zinc-500 font-medium flex items-start gap-2.5">
                        <Cpu size={16} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        <p>AI enhancements are currently disabled. You are editing in manual mode. Enable standard inline suggestions via the side control.</p>
                      </div>
                    )}
                  </div>

                  {/* TASKS LIST */}
                  <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11]">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={18} className="text-emerald-500" />
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Tasks Checklist</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">{filteredTasks.filter(t => t.status === "Done").length} of {filteredTasks.length} done</span>
                      </div>
                    </div>

                    {/* Filtered list */}
                    <div className="space-y-2">
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskStatus(task.id)}
                            className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                task.status === "Done"
                                  ? "bg-emerald-500 border-emerald-500 text-white"
                                  : "border-zinc-300 dark:border-zinc-700"
                              }`}>
                                {task.status === "Done" && <span className="text-[10px] font-bold">✓</span>}
                              </div>
                              <span className={`text-xs ${task.status === "Done" ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                                {task.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                                {task.project}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-semibold ${
                                task.priority === "High"
                                  ? "text-red-500 bg-red-500/10"
                                  : task.priority === "Medium"
                                  ? "text-amber-500 bg-amber-500/10"
                                  : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 text-center py-4">No tasks found matching your search.</p>
                      )}
                    </div>

                    {/* Quick Add Form */}
                    <form onSubmit={handleAddTask} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-[#0c0c0f]"
                      />
                      <select
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        className="h-9 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none"
                      >
                        <option value="YouTube Channel">YouTube</option>
                        <option value="SaaS Launch">SaaS Launch</option>
                        <option value="SEO Workspace">SEO Workspace</option>
                      </select>
                      <button
                        type="submit"
                        className="h-9 px-3.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1 hover:bg-indigo-700"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </form>
                  </div>
                </div>

                {/* COLUMN 3: CHANNELS & KNOWLEDGE VAULT PILLS */}
                <div className="space-y-6">
                  
                  {/* SOCIAL CHANNELS DISTRIBUTION PIPELINE */}
                  <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-500" />
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Publishing Channels</h2>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full">
                        API status: Connected
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {SOCIAL_CHANNELS.map((channel, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${channel.color} flex items-center justify-center`}>
                              <channel.icon size={16} />
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">{channel.name}</span>
                              <span className="block text-[10px] text-zinc-400">{channel.followers} audience</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-500">
                            {channel.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveTab("planner")}
                      className="w-full py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/40 dark:border-zinc-800/40 text-center rounded-xl text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 transition-colors"
                    >
                      Configure Planner Calendar
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* KNOWLEDGE VAULT PREVIEW */}
                  <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Database size={18} className="text-indigo-500" />
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">Knowledge Vault</h2>
                      </div>
                      <button
                        onClick={() => setActiveTab("vault")}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View all
                      </button>
                    </div>

                    <div className="space-y-3">
                      {INITIAL_NOTES.map((note) => (
                        <div key={note.id} className="p-3 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30 hover:border-indigo-600/30 transition-all cursor-pointer">
                          <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {note.title}
                          </span>
                          <div className="flex justify-between items-center mt-2.5">
                            <div className="flex gap-1">
                              {note.tags.map((tag, i) => (
                                <span key={i} className="text-[8px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <span className="text-[9px] text-zinc-400">
                              {note.updated}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PROJECTS VIEW */}
          {activeTab === "projects" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Projects Workspace</h1>
                <p className="text-xs text-zinc-500 mt-1">Manage, categorize, and group creator outputs into modular campaigns.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11]">
                  <h2 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">YouTube Channel</h2>
                  <div className="mt-4 space-y-2.5">
                    {tasks.filter(t => t.project === "YouTube Channel").map(task => (
                      <div key={task.id} className="p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="block text-xs font-semibold">{task.title}</span>
                        <span className={`inline-block mt-2 text-[9px] font-semibold px-2 py-0.5 rounded ${task.status === "Done" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11]">
                  <h2 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">SaaS Launch</h2>
                  <div className="mt-4 space-y-2.5">
                    {tasks.filter(t => t.project === "SaaS Launch").map(task => (
                      <div key={task.id} className="p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="block text-xs font-semibold">{task.title}</span>
                        <span className={`inline-block mt-2 text-[9px] font-semibold px-2 py-0.5 rounded ${task.status === "Done" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11]">
                  <h2 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">SEO Workspace</h2>
                  <div className="mt-4 space-y-2.5">
                    {tasks.filter(t => t.project === "SEO Workspace").map(task => (
                      <div key={task.id} className="p-3 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30">
                        <span className="block text-xs font-semibold">{task.title}</span>
                        <span className={`inline-block mt-2 text-[9px] font-semibold px-2 py-0.5 rounded ${task.status === "Done" ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KNOWLEDGE VAULT VIEW */}
          {activeTab === "vault" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Knowledge Vault</h1>
                <p className="text-xs text-zinc-500 mt-1">Central database repository storing all clippings, quotes, prompts, and outlines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INITIAL_NOTES.map(note => (
                  <div key={note.id} className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] hover:border-indigo-600/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1.5 mb-3">
                        {note.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-bold text-sm leading-snug">{note.title}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Updated {note.updated}</span>
                      <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                        Read
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add Mock Premium card for Bookmark Manager Scrapers */}
                <div className="p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
                    <Lock size={16} className="text-zinc-400" />
                  </div>
                  <span className="block text-xs font-bold mb-1">AI Web Auto-Scraper</span>
                  <span className="block text-[10px] text-zinc-500 max-w-[180px] leading-normal mb-3">Extract clean articles directly into your vault using LLM scraping.</span>
                  <button className="text-[10px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg transition-colors">
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WRITING STUDIO VIEW */}
          {activeTab === "studio" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Writing Studio</h1>
                <p className="text-xs text-zinc-500 mt-1">A distraction-free rich-text editing canvas optimized for formatting across multiple social templates.</p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold rounded">Heading</button>
                    <button className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold rounded">Bold</button>
                    <button className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[11px] font-bold rounded">Link</button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span>Characters: {editorText.length}</span>
                    <span>Words: {wordCount}</span>
                  </div>
                </div>

                <textarea
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  className="w-full min-h-[300px] p-2 bg-transparent text-sm leading-relaxed outline-none border-none resize-none font-sans"
                  placeholder="Start writing..."
                />

                <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <span className="text-[10px] text-zinc-500">Auto-saved to Local Vault draft storage</span>
                  <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 transition-all">
                    Share / Distribute <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONTENT PLANNER CALENDAR VIEW */}
          {activeTab === "planner" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Content Planner</h1>
                <p className="text-xs text-zinc-500 mt-1">Calendar orchestration mapping publication times across connected profiles.</p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Calendar Mock Header */}
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-4">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  {/* Calendar Grid cells */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Dummy padding cells */}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[100px] p-2 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/10 border border-zinc-100 dark:border-zinc-900/50 opacity-40"></div>
                    ))}

                    {/* Actual mock day cells */}
                    <div className="min-h-[100px] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400">1</span>
                      <div className="p-1 rounded bg-rose-500/10 text-rose-500 text-[9px] font-semibold flex items-center gap-1">
                        <Bookmark size={10} /> Pin Promo
                      </div>
                    </div>

                    <div className="min-h-[100px] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400">2</span>
                      <div className="p-1 rounded bg-red-500/10 text-red-500 text-[9px] font-semibold flex items-center gap-1">
                        <Video size={10} /> YT Video
                      </div>
                    </div>

                    <div className="min-h-[100px] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400">3</span>
                    </div>

                    <div className="min-h-[100px] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-zinc-400">4</span>
                      <div className="p-1 rounded bg-indigo-500/10 text-indigo-500 text-[9px] font-semibold flex items-center gap-1">
                        <FileText size={10} /> Newsletter
                      </div>
                    </div>

                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="min-h-[100px] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-zinc-400">{i + 5}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
