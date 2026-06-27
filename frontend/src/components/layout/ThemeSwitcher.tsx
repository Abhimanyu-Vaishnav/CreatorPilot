"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render an empty container of matching size to prevent layout shifts during hydration
    return <div className="w-8 h-8 rounded-lg border border-transparent"></div>;
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all border border-zinc-200/30 dark:border-zinc-800/30"
    >
      {theme === "dark" ? (
        <Sun size={16} className="text-zinc-400 hover:text-amber-500 transition-colors" />
      ) : (
        <Moon size={16} className="text-zinc-500 hover:text-indigo-600 transition-colors" />
      )}
    </button>
  );
}
