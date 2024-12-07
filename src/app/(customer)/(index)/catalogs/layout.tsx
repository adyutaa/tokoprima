// layout.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { FC, ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const queryClient = new QueryClient();

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </>
  );
};

export default Layout;
