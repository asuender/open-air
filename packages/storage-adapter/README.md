# @open-air/storage-adapter

Minimal implementation of an in-memory object storage to be used via [`storagesdk`](https://storagesdk.dev/). It satisfies its test suite, with the following exceptions:

- tests opt out most of the `url*` methods
- adapter currently does not support snapshot and fork capabilities.

You may verify this yourself by running:

```sh
pnpm test        # runs conformance suite
```
