import { Theme } from "@radix-ui/themes";
import { QueryClientProvider } from "@tanstack/preact-query";
import { render } from "preact";

import "./index.css";
import "@radix-ui/themes/styles.css";

import App from "./App.tsx";
import { queryClient } from "./utils/orpc.ts";

render(
  <Theme>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Theme>,
  document.getElementById("root")!,
);
