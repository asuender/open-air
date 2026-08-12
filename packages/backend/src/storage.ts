import { Storage } from "@storagesdk/core";
import { fs } from "@storagesdk/adapters/fs";

export const storage = new Storage({
  adapter: fs({ root: "./data/storage", folder: "local" }),
});
