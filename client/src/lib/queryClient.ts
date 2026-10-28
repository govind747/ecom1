import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
