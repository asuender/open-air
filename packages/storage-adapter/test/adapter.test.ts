import { storageAdapterTestSuite } from "@storagesdk/adapters/test-suite";

import { inMemoryAdapter } from "../src/adapter.js";

storageAdapterTestSuite({
  name: "in-memory",
  adapter: () => inMemoryAdapter({}),
  capabilities: {
    fetchableSignedUrls: false,
    presignedUploads: false,
  },
});
