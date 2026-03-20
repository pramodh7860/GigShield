import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWorker, registerWorker, getCurrentWorker } from "@workspace/api-client-react";
import type { LoginRequest, RegisterRequest, Worker } from "@workspace/api-client-react/src/generated/api.schemas";
import { useLocation } from "wouter";

interface AuthContextType {
  user: Worker | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("gigshield_token"));
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await getCurrentWorker({ headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        localStorage.removeItem("gigshield_token");
        setToken(null);
        return null;
      }
    },
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await loginWorker(data);
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("gigshield_token", data.token);
      setToken(data.token);
      queryClient.setQueryData(["auth", "me"], data.worker);
      setLocation("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await registerWorker(data);
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("gigshield_token", data.token);
      setToken(data.token);
      queryClient.setQueryData(["auth", "me"], data.worker);
      setLocation("/dashboard");
    },
  });

  const logout = () => {
    localStorage.removeItem("gigshield_token");
    setToken(null);
    queryClient.setQueryData(["auth", "me"], null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        token,
        isLoading,
        login: async (d) => { await loginMutation.mutateAsync(d); },
        register: async (d) => { await registerMutation.mutateAsync(d); },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function getAuthHeaders() {
  const token = localStorage.getItem("gigshield_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
