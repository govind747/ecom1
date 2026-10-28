import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@shared/types";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
};

export function useUser() {
  return useQuery<AuthUser | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", session.user.id)
        .maybeSingle();

      // If a profile row is missing, derive a username from email.
      const username = profile?.username ?? session.user.email?.split("@")[0] ?? "user";
      return { id: session.user.id, email: session.user.email ?? "", username };
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration failed");

      // Create profile row.
      const { error: profileErr } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, username });
      if (profileErr) throw new Error(profileErr.message);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      queryClient.clear();
    },
  });
}

// Subscribe to auth state changes so login/logout elsewhere is reflected.
export function useAuthStateSubscription() {
  const queryClient = useQueryClient();
  useQuery({
    queryKey: ["auth-subscription"],
    queryFn: async () => {
      supabase.auth.onAuthStateChange((_event, _session) => {
        (async () => {
          queryClient.invalidateQueries({ queryKey: ["auth-user"] });
        })();
      });
      return null;
    },
    staleTime: Infinity,
  });
}

export type { Profile };
