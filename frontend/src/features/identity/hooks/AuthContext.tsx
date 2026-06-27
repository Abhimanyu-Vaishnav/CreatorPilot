"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";

export interface Profile {
  full_name: string;
  avatar_url: string | null;
  bio: string;
  youtube_handle: string;
  pinterest_handle: string;
  website_url: string | null;
}

export interface User {
  id: number;
  email: string;
  date_joined: string;
  profile: Profile;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, confirmPassword: string) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user session on boot
  useEffect(() => {
    async function loadSession() {
      const accessToken = localStorage.getItem("cp_access_token");
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await api.get<User>("/api/auth/me");
        setUser(userData);
        localStorage.setItem("cp_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Session restoration failed:", error);
        api.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post<{ access: string; refresh: string; user: User }>(
        "/api/auth/login",
        { email, password }
      );
      
      localStorage.setItem("cp_access_token", data.access);
      localStorage.setItem("cp_refresh_token", data.refresh);
      localStorage.setItem("cp_user", JSON.stringify(data.user));
      
      setUser(data.user);
      router.push("/dashboard");
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, confirmPassword: string) => {
    try {
      const data = await api.post<{ access: string; refresh: string; user: User }>(
        "/api/auth/register",
        { email, password, confirm_password: confirmPassword }
      );
      
      localStorage.setItem("cp_access_token", data.access);
      localStorage.setItem("cp_refresh_token", data.refresh);
      localStorage.setItem("cp_user", JSON.stringify(data.user));
      
      setUser(data.user);
      router.push("/dashboard");
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const refresh = localStorage.getItem("cp_refresh_token");
    try {
      if (refresh) {
        await api.post("/api/auth/logout", { refresh });
      }
    } catch (error) {
      console.error("Logout request error:", error);
    } finally {
      api.clearTokens();
      setUser(null);
      router.push("/login");
    }
  };

  const updateProfile = async (profileData: Partial<Profile>): Promise<User> => {
    try {
      const updatedUser = await api.put<User>("/api/auth/profile", profileData);
      setUser(updatedUser);
      localStorage.setItem("cp_user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
