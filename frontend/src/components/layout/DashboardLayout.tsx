"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "../../features/identity";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-zinc-500 font-medium">Booting your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Inject AI status as context if needed (can be read by child components)
  return (
    <div className="flex min-h-screen bg-[#fafafa] text-zinc-900 dark:bg-[#070709] dark:text-zinc-100 transition-colors duration-200">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAiEnabled={isAiEnabled}
        setIsAiEnabled={setIsAiEnabled}
      />

      <div className="flex flex-col flex-1 lg:pl-64">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto fade-in">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { isAiEnabled } as any);
            }
            return child;
          })}
        </main>
      </div>
    </div>
  );
}
