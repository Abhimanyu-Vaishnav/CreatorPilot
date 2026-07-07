"use client";

import React, { Suspense } from "react";
import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { CalendarWorkspace } from "../../../features/planner";
import { Loader2 } from "lucide-react";

export default function PlannerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Content Planner</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Global planning workspace. Schedule content, manage meetings, view agendas, and synchronize project tasks.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-indigo-650" size={32} />
              <p className="text-xs text-zinc-500">Loading Content Planner workspace...</p>
            </div>
          }
        >
          <CalendarWorkspace />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
