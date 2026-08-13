# @open-air/storage-adapter

Minimal implementation of in-memory object storage for use with [`storagesdk`](https://storagesdk.dev/).

The adapter supports the core storage operations covered by the conformance suite. Signed URL tests are disabled, and snapshot and fork operations intentionally return `NotSupported`. Because the suite currently exercises snapshot and fork operations, those tests are expected to fail.

Run the conformance suite with:

```sh
pnpm test
```
