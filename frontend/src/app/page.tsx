"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Shield, Cpu, Layout, CheckCircle, Star } from "lucide-react";
import { ThemeSwitcher } from "../components/layout/ThemeSwitcher";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-800 dark:bg-[#070709] dark:text-zinc-100 selection:bg-indigo-600 selection:text-white overflow-hidden relative transition-colors duration-200">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-100/30 dark:bg-indigo-950/20 blur-[150px] rounded-full pointer-events-none z-0"></div>

      {/* HEADER NAVBAR */}
      <header className="h-20 border-b border-zinc-200/60 dark:border-zinc-900 bg-white/80 dark:bg-[#070709]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto w-full transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-bold text-sm tracking-wide">
            CP
          </div>
          <div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-white block">CreatorPilot</span>
            <span className="block text-[8px] text-zinc-500 font-bold tracking-wider uppercase">Operating System</span>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          {/* Theme switcher option for landing page */}
          <ThemeSwitcher />
          
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/10"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/45 border border-indigo-200/50 dark:border-indigo-900/50 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
          <Star size={10} className="fill-current" />
          Day 1 Foundation Setup
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          The Operating System for <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent">Digital Creators</span>
        </h1>

        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Manage your complete workflow from idea to multi-channel publication. A modular, clean workspace designed to keep notes, projects, bookmarks, tasks, and scheduling connected.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
          >
            Create Your Workspace
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto h-11 px-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-center"
          >
            Access Dashboard
          </Link>
        </div>
      </section>

      {/* VALUES PROP SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-[#0e0e11]/40 backdrop-blur-sm space-y-3 transition-colors duration-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <Layout size={18} />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Modular Architecture</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Every workspace element exists as an independent DDD context block. Turn features on or off without affecting code health.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-[#0e0e11]/40 backdrop-blur-sm space-y-3 transition-colors duration-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <Cpu size={18} />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">AI-Independent Core</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            AI is an enhancement, not a dependency. All calendars, studios, databases, and managers remain fully operational if AI is disabled.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-900 bg-white/50 dark:bg-[#0e0e11]/40 backdrop-blur-sm space-y-3 transition-colors duration-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
            <Shield size={18} />
          </div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Stateless JWT Security</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Stateless authentication token pairs using Django SimpleJWT. Built-in authorization headers and automatic session restoration.
          </p>
        </div>
      </section>

      {/* CORE MODULES PREVIEW SECTION */}
      <section className="max-w-5xl mx-auto px-6 py-12 text-center space-y-12 relative z-10">
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Designed for Scale</h2>
          <p className="text-xs text-zinc-500 max-w-xl mx-auto">
            From database design to frontend states, everything conforms to premium SaaS coding standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-900 bg-white/60 dark:bg-[#0c0c0f]/80 flex items-center gap-3 transition-colors duration-200">
            <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Identity Context</span>
          </div>
          <div className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-900 bg-white/60 dark:bg-[#0c0c0f]/80 flex items-center gap-3 transition-colors duration-200">
            <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Profile Database</span>
          </div>
          <div className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-900 bg-white/60 dark:bg-[#0c0c0f]/80 flex items-center gap-3 transition-colors duration-200">
            <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Theme Switching</span>
          </div>
          <div className="p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-900 bg-white/60 dark:bg-[#0c0c0f]/80 flex items-center gap-3 transition-colors duration-200">
            <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Validation Guards</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-900 py-12 text-center text-xs text-zinc-500 dark:text-zinc-600 relative z-10 max-w-7xl mx-auto w-full px-6">
        <p>© 2026 CreatorPilot. Bounded Domain Architecture. All rights reserved.</p>
      </footer>

    </div>
  );
}
