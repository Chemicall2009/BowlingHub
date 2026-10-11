/**
 * @file src/providers/QueryProvider.tsx
 * @description Провайдер TanStack Query v5 с QueryCache и MutationCache для глобальной обработки ошибок.
 */

import React from "react";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      const status = error?.status;
      if (status !== 401 && status !== 404) {
        toast.error(error?.message || "Ошибка запроса данных");
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      if (import.meta.env.DEV) {
        console.error("[MutationError]:", error);
      }
      toast.error(error?.message || "Ошибка выполнения операции");
    },
  }),
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
