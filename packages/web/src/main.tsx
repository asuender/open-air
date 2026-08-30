import { Theme } from "@radix-ui/themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";

import "./index.css";
import "@radix-ui/themes/styles.css";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { queryClient } from "./utils/orpc.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Theme>
  </StrictMode>,
);
