"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { registerSchema, RegisterInput } from "../validation";
import { useAuth } from "../hooks/AuthContext";

export function RegisterForm() {
  const { register: authRegister } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    setLoading(true);
    try {
      await authRegister(data.email, data.password, data.confirmPassword);
    } catch (err: any) {
      if (err?.email) {
        setError(err.email[0]);
      } else {
        setError(err?.detail || "An error occurred during registration. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-[#0e0e11] shadow-2xl shadow-zinc-950/5">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Create an account</h2>
        <p className="text-xs text-zinc-500 mt-1.5">Get started with your CreatorPilot workspace</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-fadeIn">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

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

        <div>
          <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password")}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all placeholder-zinc-400"
          />
          {errors.password && (
            <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            className="w-full h-10 px-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 text-xs border border-zinc-200/50 dark:border-zinc-800/50 outline-none focus:border-indigo-600 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-[#0c0c0f] transition-all placeholder-zinc-400"
          />
          {errors.confirmPassword && (
            <p className="text-[10px] text-rose-500 mt-1 font-medium">{errors.confirmPassword.message}</p>
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
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
