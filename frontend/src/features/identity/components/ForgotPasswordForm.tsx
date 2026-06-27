"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { forgotPasswordSchema, ForgotPasswordInput } from "../validation";

export function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    // Day 1 mock API response
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="w-full max-w-sm p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] shadow-2xl shadow-zinc-950/5">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Forgot Password</h2>
        <p className="text-xs text-zinc-500 mt-1.5">Reset your CreatorPilot credentials</p>
      </div>

      {success ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block mb-1">Email Sent</span>
              <p className="leading-relaxed">If that email exists in our records, we've sent instructions to reset your password.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="w-full h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 text-zinc-900 dark:text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all placeholder-zinc-400"
            />
            {errors.email && (
              <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:scale-100 disabled:opacity-70 text-white font-semibold text-xs shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-all mt-6"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                Send Reset Link
                <ArrowRight size={14} />
              </>
            )}
          </button>

          <div className="text-center mt-6 text-xs text-zinc-500">
            <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
