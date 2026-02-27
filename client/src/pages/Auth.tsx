import { useState } from "react";
import { useLocation } from "wouter";
import { useUser, useLogin, useRegister } from "@/hooks/use-auth";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Minimal forms, local state for simplicity in a visual-first pass
export default function Auth() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const login = useLogin();
  const register = useRegister();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }

    const payload = { username, password };
    
    if (isLogin) {
      login.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Welcome back!" });
          setLocation("/");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      });
    } else {
      register.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Account created successfully!" });
          setLocation("/");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen pt-16 flex">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
              {isLogin ? "Sign in to LUXE" : "Create an account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Username
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full rounded-xl border-border px-4 py-3 bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-border px-4 py-3 bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary focus:border-primary transition-all sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  isLogin ? "Sign in" : "Sign up"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:block relative w-0 flex-1">
        {/* minimal lifestyle shopping bags */}
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="Shopping experience"
        />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>
    </div>
  );
}
