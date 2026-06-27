"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ForgotPasswordForm, useAuth } from "../../../features/identity";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#070709]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black p-4">
      <ForgotPasswordForm />
    </div>
  );
}
