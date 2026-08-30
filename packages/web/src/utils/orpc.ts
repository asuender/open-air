import { createClient } from "@open-air/backend";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

const client = createClient(globalThis.location.origin);

export const orpc = createTanstackQueryUtils(client);
