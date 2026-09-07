"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { PostHogProvider } from "@/lib/analytics";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <PostHogProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </PostHogProvider>
  );
}
